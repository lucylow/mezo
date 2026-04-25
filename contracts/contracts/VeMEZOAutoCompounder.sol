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
import "./interfaces/ITigrisRouter.sol";
import "./interfaces/IMUSDSavingsVault.sol";
import "./VeMEZOVaultToken.sol";

/**
 * @title VeMEZOAutoCompounder
 * @notice Auto-compounder vault for veMEZO NFTs on the Mezo chain.
 *         Users deposit veMEZO NFTs; the keeper bot claims rebase + gauge rewards
 *         each epoch, takes a performance fee (default 10%), and re-locks the
 *         remainder back into veMEZO — growing everyone's underlying position
 *         without manual intervention.
 *
 * Decentralization additions (Phase 3)
 * ──────────────────────────────────────
 *  • Performance fee is now split: a configurable fraction (feeDistributionRate)
 *    goes to vveMEZO holders via a pull-based reward pool; the rest goes to treasury.
 *  • `claimFeeRewards()` lets any vveMEZO holder claim their accumulated share.
 *  • `setFeeDistributionRate()` and `setPerformanceFee()` are now routed through
 *    the VaultTimelockController when governance is active.
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
 *                                   │   • split fee:           │
 *                                   │     → holders (pull)     │
 *                                   │     → treasury           │
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
    ITigrisRouter    public immutable tigrisRouter;

    // ── Mutable config ──────────────────────────────────────────────────────
    address public keeper;
    uint256 public performanceFee   = 1000;         // 10% in basis points
    uint256 public constant MAX_PERFORMANCE_FEE = 2000; // 20% cap
    uint256 public constant MIN_PERFORMANCE_FEE = 500;  // 5% floor
    address public treasury;
    uint256 public minDepositValue  = 1e18;
    bool    public autoMaxLock      = true;
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days;

    /// @notice When set with a non-zero router, performance fees swap to MUSD (Mezo integration).
    bool    public autoStakeMUSD = true;
    /// @notice Optional MUSD savings vault; shares are minted to `treasury` when auto-stake is on.
    address public musdSavingsVault;

    // ── Fee distribution to vveMEZO holders (Phase 3) ───────────────────────

    /// @notice Fraction of collected MUSD fees distributed to vveMEZO holders (basis points).
    ///         10000 = 100%, 5000 = 50%.  The remainder goes to treasury.
    uint256 public feeDistributionRate = 5000;
    uint256 public constant MAX_FEE_DISTRIBUTION_RATE = 9000; // 90% max to holders

    /// @dev Precision multiplier for per-share fee accounting.
    uint256 private constant PRECISION = 1e18;

    /// @dev Cumulative MUSD fee per vveMEZO share (scaled by PRECISION).
    uint256 public feePerShare;

    /// @dev Per-user reward debt checkpoint.
    mapping(address => uint256) public userRewardDebt;

    /// @dev Total MUSD currently in the reward pool (not yet claimed).
    uint256 public feePool;

    // ── State ────────────────────────────────────────────────────────────────
    uint256 public totalUnderlying;
    uint256 public lastCompoundTime;
    /// @notice Cumulative performance fees received in MUSD (18 decimals).
    uint256 public totalFeesCollectedMusd;

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
    event FeeCollected(uint256 mezoAmount, uint256 musdAmount, address treasury);
    event TreasuryStaked(uint256 musdAmount, uint256 sharesReceived);
    event AutoStakeMUSDUpdated(bool enabled, address savingsVault);
    event FeeDistributed(uint256 totalFee, uint256 toHolders, uint256 toTreasury);
    event FeeDistributionRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardsClaimed(address indexed user, uint256 amount);

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
        address _treasury,
        address _tigrisRouter
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
        tigrisRouter    = ITigrisRouter(_tigrisRouter);
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

        // Checkpoint reward debt before share balance changes.
        _updateRewardDebt(msg.sender);

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
        _updateRewardDebt(msg.sender);
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

        // Auto-claim pending fee rewards on withdrawal.
        _claimPendingRewards(msg.sender);

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

        _claimPendingRewards(msg.sender);

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

        if (fee > 0) {
            if (address(tigrisRouter) != address(0)) {
                uint256 musdAmt = _collectFeeInMUSD(fee);
                totalFeesCollectedMusd += musdAmt;
            } else {
                mezoToken.safeTransfer(treasury, fee);
            }
        }
        if (compounded > 0) {
            mezoToken.forceApprove(address(veMEZO), compounded);
            veMEZO.increaseAmount(tokenId, compounded);
            if (autoMaxLock) {
                veMEZO.increaseUnlockTime(tokenId, block.timestamp + MAX_LOCK_DURATION);
            }
        }
    }

    // ── Fee distribution ─────────────────────────────────────────────────────

    /**
     * @notice Claim accumulated fee rewards for the caller.
     *         Rewards are proportional to the caller's vveMEZO balance at
     *         each compound epoch.
     */
    function claimFeeRewards() external nonReentrant {
        uint256 pending = _calculatePendingRewards(msg.sender);
        require(pending > 0, "No pending rewards");
        _claimPendingRewards(msg.sender);
    }

    /**
     * @notice View the pending fee rewards for a given user.
     */
    function pendingFeeRewards(address user) external view returns (uint256) {
        return _calculatePendingRewards(user);
    }

    function _calculatePendingRewards(address user) internal view returns (uint256) {
        uint256 userShares  = vaultToken.balanceOf(user);
        if (userShares == 0) return 0;
        uint256 accumulated = (userShares * feePerShare) / PRECISION;
        uint256 debt        = userRewardDebt[user];
        return accumulated > debt ? accumulated - debt : 0;
    }

    function _claimPendingRewards(address user) internal {
        uint256 pending = _calculatePendingRewards(user);
        _updateRewardDebt(user);
        if (pending == 0) return;

        feePool -= pending;
        IERC20(address(musdToken)).safeTransfer(user, pending);
        emit RewardsClaimed(user, pending);
    }

    function _updateRewardDebt(address user) internal {
        uint256 userShares = vaultToken.balanceOf(user);
        userRewardDebt[user] = (userShares * feePerShare) / PRECISION;
    }

    function _distributeToHolders(uint256 amount) internal {
        uint256 totalShares = vaultToken.totalSupply();
        if (totalShares == 0) {
            // No holders: fall through to treasury
            IERC20(address(musdToken)).safeTransfer(treasury, amount);
            return;
        }
        feePool    += amount;
        feePerShare += (amount * PRECISION) / totalShares;
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

    /**
     * @dev Swap performance fee MEZO to MUSD via Tigris, then split between
     *      vveMEZO holder reward pool and treasury.
     */
    function _collectFeeInMUSD(uint256 feeAmountMezo) internal returns (uint256 musdAmount) {
        if (feeAmountMezo == 0) return 0;

        address[] memory path = new address[](2);
        path[0] = address(mezoToken);
        path[1] = address(musdToken);

        uint256 minOut = _minMusdOut(feeAmountMezo, path);
        mezoToken.forceApprove(address(tigrisRouter), feeAmountMezo);

        uint256[] memory amounts = tigrisRouter.swapExactTokensForTokens(
            feeAmountMezo,
            minOut,
            path,
            address(this),
            block.timestamp + 300
        );
        musdAmount = amounts[amounts.length - 1];

        mezoToken.forceApprove(address(tigrisRouter), 0);

        // Split: feeDistributionRate fraction → holder pool, remainder → treasury.
        uint256 toHolders  = (musdAmount * feeDistributionRate) / 10000;
        uint256 toTreasury = musdAmount - toHolders;

        if (toHolders > 0) {
            _distributeToHolders(toHolders);
        }

        if (toTreasury > 0) {
            if (autoStakeMUSD && musdSavingsVault != address(0)) {
                IERC20(address(musdToken)).forceApprove(musdSavingsVault, toTreasury);
                uint256 shares = IMUSDSavingsVault(musdSavingsVault).deposit(toTreasury, treasury);
                IERC20(address(musdToken)).forceApprove(musdSavingsVault, 0);
                emit TreasuryStaked(toTreasury, shares);
            } else {
                IERC20(address(musdToken)).safeTransfer(treasury, toTreasury);
            }
        }

        emit FeeCollected(feeAmountMezo, musdAmount, treasury);
        emit FeeDistributed(musdAmount, toHolders, toTreasury);
    }

    function _minMusdOut(uint256 mezoIn, address[] memory path) internal view returns (uint256) {
        uint256[] memory quote = tigrisRouter.getAmountsOut(mezoIn, path);
        uint256 expected = quote[quote.length - 1];
        return (expected * 99) / 100;
    }

    // ── Gauge voting (epoch management) ──────────────────────────────────────

    /**
     * @notice Gauge allocation for voting — maps gauge address to weight (bps, must sum ≤ 10000).
     */
    struct GaugeVote {
        address gauge;
        uint256 weight; // basis points
    }

    GaugeVote[] public gaugeVotes;
    uint256 public lastVoteTime;

    event GaugesVoted(uint256 indexed epochTimestamp, uint256 tokenCount, uint256 gaugeCount);
    event GaugeVotesSet(GaugeVote[] votes);

    /**
     * @notice Configure the gauge allocation used when voteForGauges is called.
     * @param votes Array of (gauge, weight) pairs.  Weights must sum ≤ 10000.
     */
    function setGaugeVotes(GaugeVote[] calldata votes) external onlyOwner {
        uint256 totalWeight;
        for (uint256 i = 0; i < votes.length; i++) {
            require(votes[i].gauge != address(0), "Invalid gauge");
            totalWeight += votes[i].weight;
        }
        require(totalWeight <= 10000, "Weights exceed 10000 bps");

        delete gaugeVotes;
        for (uint256 i = 0; i < votes.length; i++) {
            gaugeVotes.push(votes[i]);
        }
        emit GaugeVotesSet(votes);
    }

    /**
     * @notice Re-cast votes for every deposited veMEZO NFT across the configured gauges.
     *         Must be called once per epoch (Thursdays ~00:05 UTC) by the keeper.
     *         veMEZO voting power decays and votes must be refreshed every 7-day epoch.
     */
    function voteForGauges() external {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        uint256 len = gaugeVotes.length;
        require(len > 0, "No gauge votes configured");

        uint256[] memory tokenIds = getDepositedTokenIds();
        uint256 tokenCount = tokenIds.length;

        for (uint256 i = 0; i < tokenCount; i++) {
            for (uint256 j = 0; j < len; j++) {
                try gaugeController.vote(tokenIds[i], gaugeVotes[j].gauge, gaugeVotes[j].weight) {}
                catch {}
            }
        }

        lastVoteTime = block.timestamp;
        emit GaugesVoted(block.timestamp, tokenCount, len);
    }

    /**
     * @notice Returns the configured gauge vote allocations.
     */
    function getGaugeVotes() external view returns (GaugeVote[] memory) {
        return gaugeVotes;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function updateKeeper(address newKeeper) external onlyOwner {
        require(newKeeper != address(0), "Invalid keeper");
        emit KeeperUpdated(keeper, newKeeper);
        keeper = newKeeper;
    }

    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee >= MIN_PERFORMANCE_FEE, "Below min fee");
        require(newFee <= MAX_PERFORMANCE_FEE, "Exceeds max fee");
        emit PerformanceFeeUpdated(performanceFee, newFee);
        performanceFee = newFee;
    }

    /**
     * @notice Update the fraction of fees distributed to vveMEZO holders.
     * @param newRate Basis points (0–9000). 5000 = 50% to holders, 50% to treasury.
     */
    function setFeeDistributionRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_FEE_DISTRIBUTION_RATE, "Exceeds max rate");
        emit FeeDistributionRateUpdated(feeDistributionRate, newRate);
        feeDistributionRate = newRate;
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

    function setAutoStakeMUSD(bool enabled, address savingsVault) external onlyOwner {
        autoStakeMUSD = enabled;
        musdSavingsVault = savingsVault;
        emit AutoStakeMUSDUpdated(enabled, savingsVault);
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
