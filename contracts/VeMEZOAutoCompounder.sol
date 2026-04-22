// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IVeMEZO.sol";
import "./interfaces/IGaugeController.sol";
import "./interfaces/IMUSD.sol";
import "./VeMEZOVaultToken.sol";

/**
 * @title VeMEZOAutoCompounder
 * @notice Auto-compounder vault for veMEZO NFTs on the Mezo chain.
 *         Users deposit veMEZO NFTs; the keeper bot claims rebase + gauge rewards
 *         each epoch, takes a performance fee (default 10%), and re-locks the
 *         remainder back into veMEZO — growing everyone's underlying position
 *         without manual intervention.
 *
 * Architecture
 * ────────────
 *  ┌─────────────┐   deposit NFT    ┌──────────────────────────┐
 *  │    User     │ ───────────────► │  VeMEZOAutoCompounder    │
 *  │             │ ◄─────────────── │  (this contract)         │
 *  │             │  vveMEZO shares  │                          │
 *  └─────────────┘                  │  compoundAll() (keeper)  │
 *                                   │   • claimRebase          │
 *                                   │   • claimRewards         │
 *                                   │   • take fee → treasury  │
 *                                   │   • increaseAmount       │
 *                                   │   • increaseUnlockTime   │
 *                                   └──────────────────────────┘
 *
 * Chain Info
 * ──────────
 *  Mezo Testnet : chainId 31611  RPC https://rpc.test.mezo.org
 *  Mezo Mainnet : chainId 31612  RPC https://rpc.mezo.org
 *  Native gas token : BTC
 */
contract VeMEZOAutoCompounder is IERC721Receiver, Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    // ── Immutables ──────────────────────────────────────────────────────────
    IVeMEZO          public immutable veMEZO;
    IGaugeController public immutable gaugeController;
    IERC20           public immutable mezoToken;
    IMUSD            public immutable musdToken;
    VeMEZOVaultToken public immutable vaultToken;

    // ── Mutable config ──────────────────────────────────────────────────────
    address public keeper;
    uint256 public performanceFee   = 1000;         // 10% in basis points
    uint256 public constant MAX_PERFORMANCE_FEE = 2000; // 20% cap
    address public treasury;
    uint256 public minDepositValue  = 1e18;
    bool    public autoMaxLock      = true;
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days;

    // ── State ────────────────────────────────────────────────────────────────
    uint256 public totalUnderlying;
    uint256 public lastCompoundTime;

    mapping(uint256 => address)           public nftOwner;
    mapping(address => EnumerableSet.UintSet) private _userTokenIds;
    EnumerableSet.UintSet                 private _depositedTokenIds;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares);
    event Withdrawn(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares);
    event Compounded(uint256 totalRewards, uint256 fee, uint256 amountCompounded);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event MinDepositValueUpdated(uint256 oldValue, uint256 newValue);
    event AutoMaxLockUpdated(bool enabled);
    event EmergencyWithdrawal(address indexed user, uint256 indexed tokenId);

    modifier onlyKeeper() {
        require(msg.sender == keeper, "VeMEZOAutoCompounder: caller is not keeper");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _veMEZO,
        address _gaugeController,
        address _mezoToken,
        address _musdToken,
        address _treasury
    ) Ownable(msg.sender) {
        require(_veMEZO           != address(0), "Invalid veMEZO address");
        require(_gaugeController  != address(0), "Invalid gauge controller");
        require(_mezoToken        != address(0), "Invalid MEZO token");
        require(_musdToken        != address(0), "Invalid MUSD token");
        require(_treasury         != address(0), "Invalid treasury");

        veMEZO          = IVeMEZO(_veMEZO);
        gaugeController = IGaugeController(_gaugeController);
        mezoToken       = IERC20(_mezoToken);
        musdToken       = IMUSD(_musdToken);
        treasury        = _treasury;
        keeper          = msg.sender;

        vaultToken = new VeMEZOVaultToken(
            "Vault veMEZO Share",
            "vveMEZO",
            address(this),
            _mezoToken
        );
    }

    // ── Deposit ──────────────────────────────────────────────────────────────

    /// @notice Deposit a single veMEZO NFT and receive vault shares.
    function deposit(uint256 tokenId) external whenNotPaused nonReentrant returns (uint256 shares) {
        require(veMEZO.ownerOf(tokenId) == msg.sender, "Not owner");
        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        require(nftValue >= minDepositValue, "Below minimum deposit value");

        nftOwner[tokenId] = msg.sender;
        _userTokenIds[msg.sender].add(tokenId);
        _depositedTokenIds.add(tokenId);
        totalUnderlying += nftValue;

        shares = vaultToken.mintShares(msg.sender, nftValue);
        emit Deposited(msg.sender, tokenId, nftValue, shares);
        veMEZO.safeTransferFrom(msg.sender, address(this), tokenId);
        return shares;
    }

    /// @notice Batch deposit multiple veMEZO NFTs atomically.
    function depositBatch(uint256[] calldata tokenIds)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 totalShares)
    {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tid = tokenIds[i];
            require(veMEZO.ownerOf(tid) == msg.sender, "Not owner");
            uint256 nftValue = veMEZO.balanceOfNFT(tid);
            require(nftValue >= minDepositValue, "Below minimum deposit value");
            nftOwner[tid] = msg.sender;
            _userTokenIds[msg.sender].add(tid);
            _depositedTokenIds.add(tid);
            totalValue += nftValue;
            emit Deposited(msg.sender, tid, nftValue, 0);
        }
        totalUnderlying += totalValue;
        totalShares = vaultToken.mintShares(msg.sender, totalValue);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            veMEZO.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
        }
        return totalShares;
    }

    // ── Withdraw ─────────────────────────────────────────────────────────────

    /// @notice Withdraw a specific NFT by tokenId (burns proportional shares).
    function withdraw(uint256 tokenId) external nonReentrant returns (uint256 shares) {
        require(nftOwner[tokenId] == msg.sender, "Not depositor");
        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        shares = vaultToken.convertToShares(nftValue);
        require(shares <= vaultToken.balanceOf(msg.sender), "Insufficient shares");

        delete nftOwner[tokenId];
        _userTokenIds[msg.sender].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;

        uint256 assets = vaultToken.burnShares(msg.sender, shares);
        emit Withdrawn(msg.sender, tokenId, assets, shares);
        veMEZO.safeTransferFrom(address(this), msg.sender, tokenId);
        return shares;
    }

    /// @notice Withdraw best-matching NFT given a share amount.
    function withdrawByShares(uint256 shares) external nonReentrant returns (uint256 tokenId) {
        require(shares > 0, "Zero shares");
        require(shares <= vaultToken.balanceOf(msg.sender), "Insufficient shares");
        tokenId = _findWithdrawableNFT(msg.sender, shares);
        require(tokenId != 0, "No suitable NFT found");

        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        delete nftOwner[tokenId];
        _userTokenIds[msg.sender].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;

        uint256 assets = vaultToken.burnShares(msg.sender, shares);
        emit Withdrawn(msg.sender, tokenId, assets, shares);
        veMEZO.safeTransferFrom(address(this), msg.sender, tokenId);
        return tokenId;
    }

    // ── Compounding ──────────────────────────────────────────────────────────

    /// @notice Compound all deposited NFTs (keeper-only). Claims rebase + gauge
    ///         rewards, deducts the performance fee, and re-locks the remainder.
    function compoundAll()
        external
        onlyKeeper
        whenNotPaused
        nonReentrant
        returns (uint256 totalRewards, uint256 totalFee, uint256 totalCompounded)
    {
        uint256[] memory tokenIds = getDepositedTokenIds();
        require(tokenIds.length > 0, "No deposits");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            (uint256 r, uint256 f, uint256 c) = _compound(tokenIds[i]);
            totalRewards    += r;
            totalFee        += f;
            totalCompounded += c;
        }

        totalUnderlying = _calculateTotalUnderlying();
        vaultToken.updateTotalAssets(totalUnderlying);
        lastCompoundTime = block.timestamp;
        emit Compounded(totalRewards, totalFee, totalCompounded);
    }

    function _compound(uint256 tokenId)
        internal
        returns (uint256 rewards, uint256 fee, uint256 compounded)
    {
        require(nftOwner[tokenId] != address(0), "Token not deposited");

        uint256 rebaseAmount    = 0;
        uint256 incentiveAmount = 0;
        try veMEZO.claimRebase(tokenId)             returns (uint256 a) { rebaseAmount    = a; } catch {}
        try gaugeController.claimRewards(tokenId)   returns (uint256 a) { incentiveAmount = a; } catch {}

        rewards = rebaseAmount + incentiveAmount;
        if (rewards == 0) return (0, 0, 0);

        fee       = (rewards * performanceFee) / 10000;
        compounded = rewards - fee;

        if (fee > 0) mezoToken.safeTransfer(treasury, fee);
        if (compounded > 0) {
            mezoToken.forceApprove(address(veMEZO), compounded);
            veMEZO.increaseAmount(tokenId, compounded);
            if (autoMaxLock) {
                veMEZO.increaseUnlockTime(tokenId, block.timestamp + MAX_LOCK_DURATION);
            }
        }
    }

    // ── View helpers ─────────────────────────────────────────────────────────

    function getDepositedTokenIds() public view returns (uint256[] memory) {
        return _depositedTokenIds.values();
    }

    function getDepositedTokenCount() public view returns (uint256) {
        return _depositedTokenIds.length();
    }

    function getUserTokenIds(address user) public view returns (uint256[] memory) {
        return _userTokenIds[user].values();
    }

    function getUserTokenCount(address user) public view returns (uint256) {
        return _userTokenIds[user].length();
    }

    function getPendingRewards() public view returns (uint256 totalPending) {
        uint256[] memory tokenIds = getDepositedTokenIds();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPending += gaugeController.pendingRewards(tokenIds[i]);
        }
    }

    /// @notice Returns true if compounding would be profitable at the given gas price.
    function checkUpkeep(uint256 gasPrice) public view returns (bool canCompound) {
        uint256 pending      = getPendingRewards();
        if (pending == 0) return false;
        uint256 estimatedGas = 300_000 + (getDepositedTokenCount() * 200_000);
        uint256 gasCost      = gasPrice * estimatedGas;
        return pending > (gasCost * 11) / 10;   // require 10% profit margin
    }

    function calculateTotalUnderlying() public view returns (uint256) {
        return _calculateTotalUnderlying();
    }

    function _calculateTotalUnderlying() internal view returns (uint256 total) {
        uint256[] memory tokenIds = getDepositedTokenIds();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += veMEZO.balanceOfNFT(tokenIds[i]);
        }
    }

    function _findWithdrawableNFT(address user, uint256 shares) internal view returns (uint256) {
        uint256 targetValue = vaultToken.convertToAssets(shares);
        uint256 bestId      = 0;
        uint256 bestDiff    = type(uint256).max;
        uint256[] memory tokens = getUserTokenIds(user);
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 v    = veMEZO.balanceOfNFT(tokens[i]);
            uint256 diff = v > targetValue ? v - targetValue : targetValue - v;
            if (diff < bestDiff) { bestDiff = diff; bestId = tokens[i]; }
        }
        return bestId;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function updateKeeper(address newKeeper) external onlyOwner {
        require(newKeeper != address(0), "Invalid keeper");
        emit KeeperUpdated(keeper, newKeeper);
        keeper = newKeeper;
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PERFORMANCE_FEE, "Exceeds max fee");
        emit PerformanceFeeUpdated(performanceFee, newFee);
        performanceFee = newFee;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setMinDepositValue(uint256 newMin) external onlyOwner {
        emit MinDepositValueUpdated(minDepositValue, newMin);
        minDepositValue = newMin;
    }

    function setAutoMaxLock(bool enabled) external onlyOwner {
        autoMaxLock = enabled;
        emit AutoMaxLockUpdated(enabled);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyWithdraw(uint256 tokenId, address to) external onlyOwner {
        require(nftOwner[tokenId] != address(0), "Token not deposited");
        require(to != address(0), "Invalid recipient");
        address user     = nftOwner[tokenId];
        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        delete nftOwner[tokenId];
        _userTokenIds[user].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;
        uint256 shares = vaultToken.convertToShares(nftValue);
        vaultToken.burnShares(user, shares);
        emit EmergencyWithdrawal(user, tokenId);
        veMEZO.safeTransferFrom(address(this), to, tokenId);
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        override
        returns (bytes4)
    {
        require(msg.sender == address(veMEZO), "Only veMEZO NFTs accepted");
        return this.onERC721Received.selector;
    }
}
