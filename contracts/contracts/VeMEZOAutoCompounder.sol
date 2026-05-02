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
 * @title  VeMEZOAutoCompounder
 * @notice Auto-compounder vault for veMEZO NFTs on the Mezo chain.
 *
 *         Users deposit veMEZO NFTs and receive vveMEZO vault shares.
 *         The keeper bot claims rebase + gauge rewards each epoch, deducts a
 *         performance fee, and re-locks the remainder — growing every depositor's
 *         underlying position without manual intervention.
 *
 * @dev    Security architecture
 *         ──────────────────────
 *         • Multi-keeper registry: multiple independent keepers may be authorised
 *           simultaneously, eliminating the single-point-of-failure of a single key.
 *         • Deposit lock period: each NFT is locked for `minDepositDuration` after
 *           deposit to prevent flash-loan share manipulation.
 *         • Compound cooldown: an on-chain `minCompoundInterval` prevents a
 *           compromised keeper from spamming `compoundAll()`.
 *         • Paginated compounding: `compoundBatch()` lets the keeper process large
 *           vaults in smaller chunks, avoiding block gas-limit DoS.
 *         • Configurable slippage: `swapSlippageBps` is owner-adjustable so MEV
 *           protection can be tuned without a contract redeployment.
 *         • CEI pattern everywhere: all state changes complete before external calls.
 *         • Pull-based fee rewards: vveMEZO holders call `claimFeeRewards()`.
 *
 *         Decentralization (Phase 3)
 *         ──────────────────────────
 *         • Performance fees are split: `feeDistributionRate` bps go to vveMEZO
 *           holders via a pull-based MUSD reward pool; the rest goes to treasury
 *           (optionally auto-staked into the MUSD Savings Vault).
 *         • Gauge votes are recast every epoch via `voteForGauges()` (keeper-callable).
 *
 *         Architecture
 *         ────────────
 *          ┌─────────────┐  deposit NFT    ┌──────────────────────────┐
 *          │    User     │ ───────────────►│  VeMEZOAutoCompounder    │
 *          │             │ ◄─────────────── │  (this contract)         │
 *          │             │  vveMEZO shares  │                          │
 *          └─────────────┘                  │  compoundAll() (keeper)  │
 *                                           │   • claimRebase          │
 *                                           │   • claimRewards         │
 *                                           │   • split fee → holders  │
 *                                           │     + treasury           │
 *                                           │   • increaseAmount       │
 *                                           │   • increaseUnlockTime   │
 *                                           └──────────────────────────┘
 *
 *         Chain Info
 *         ──────────
 *          Mezo Testnet : chainId 31611  RPC https://rpc.test.mezo.org
 *          Mezo Mainnet : chainId 31612  RPC https://rpc.mezo.org
 *          Native gas token: BTC
 */
contract VeMEZOAutoCompounder is IERC721Receiver, Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    // ── Custom errors ────────────────────────────────────────────────────────

    error NotOwner(uint256 tokenId, address caller);
    error NotDepositor(uint256 tokenId, address caller);
    error BelowMinimumDeposit(uint256 provided, uint256 minimum);
    error InsufficientShares(uint256 requested, uint256 available);
    error ZeroShares();
    error NoSuitableNFT();
    error NoPendingRewards();
    error NoDeposits();
    error TokenNotDeposited(uint256 tokenId);
    error InvalidAddress();
    error EmptyBatch();
    error InvalidGauge(address gauge);
    error InvalidGaugeWeights(uint256 total);
    error NoGaugeVotes();
    error FeeBelowMinimum(uint256 provided, uint256 minimum);
    error FeeExceedsMaximum(uint256 provided, uint256 maximum);
    error RateExceedsMaximum(uint256 provided, uint256 maximum);
    error UnauthorizedNFT(address sender);
    error Unauthorized(address caller);

    // ── Security: multi-keeper ────────────────────────────────────────────────
    error KeeperAlreadyAuthorized(address addr);
    error KeeperNotAuthorized(address addr);

    // ── Security: deposit lock period ────────────────────────────────────────
    /// @notice Raised when a withdrawal is attempted before the deposit lock expires.
    error DepositLocked(uint256 tokenId, uint256 lockedUntil, uint256 current);
    /// @notice Raised by withdrawByShares when all of the user's NFTs are still locked.
    error NoUnlockedNFT();

    // ── Security: compound cooldown ──────────────────────────────────────────
    error CompoundTooSoon(uint256 nextAllowed, uint256 current);

    // ── Security: configurable slippage ──────────────────────────────────────
    error InvalidSlippage(uint256 provided, uint256 minBps, uint256 maxBps);

    // ── Security: duration bounds ────────────────────────────────────────────
    error InvalidDuration(uint256 provided, uint256 minVal, uint256 maxVal);

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice The veMEZO NFT contract (ERC-721, time-locked MEZO positions).
    IVeMEZO          public immutable veMEZO;

    /// @notice Mezo gauge controller — used for voting and reward claiming.
    IGaugeController public immutable gaugeController;

    /// @notice MEZO ERC-20 token — the underlying asset of veMEZO positions.
    IERC20           public immutable mezoToken;

    /// @notice MUSD stablecoin — used for fee collection and treasury staking.
    IMUSD            public immutable musdToken;

    /// @notice vveMEZO vault share token (ERC-20, ERC-4626 compatible).
    VeMEZOVaultToken public immutable vaultToken;

    /// @notice DEX router used to swap MEZO performance fees into MUSD.
    ///         Address(0) disables the swap; fees are sent as MEZO instead.
    ITigrisRouter    public immutable tigrisRouter;

    // ── Fee constants ────────────────────────────────────────────────────────

    /// @notice Maximum performance fee: 20% in basis points.
    uint256 public constant MAX_PERFORMANCE_FEE = 2000;

    /// @notice Minimum performance fee: 5% in basis points.
    uint256 public constant MIN_PERFORMANCE_FEE = 500;

    /// @notice Maximum fraction of fees that may go to vveMEZO holders: 90%.
    uint256 public constant MAX_FEE_DISTRIBUTION_RATE = 9000;

    /// @notice veMEZO maximum lock duration: 208 weeks (≈ 4 years).
    ///         Matches the Mezo Earn protocol's hard cap.
    uint256 public constant MAX_LOCK_DURATION = 208 weeks;

    // ── Security constants ───────────────────────────────────────────────────

    /// @notice Minimum swap slippage tolerance: 0.1% (10 bps).
    uint256 public constant MIN_SLIPPAGE_BPS = 10;

    /// @notice Maximum swap slippage tolerance: 5% (500 bps).
    uint256 public constant MAX_SLIPPAGE_BPS = 500;

    /// @notice Maximum configurable compound interval: 7 days.
    uint256 public constant MAX_COMPOUND_INTERVAL = 7 days;

    /// @notice Maximum configurable deposit lock duration: 30 days.
    uint256 public constant MAX_DEPOSIT_DURATION = 30 days;

    // ── Mutable config ───────────────────────────────────────────────────────

    /// @notice Performance fee in basis points (default 10%).
    uint256 public performanceFee = 1000;

    /// @notice Treasury address — receives the non-holder portion of fees.
    address public treasury;

    /// @notice Minimum veMEZO NFT value (voting power units) accepted on deposit.
    uint256 public minDepositValue = 1e18;

    /// @notice When true, the keeper extends every NFT's lock to MAX_LOCK_DURATION
    ///         after each compound, maximising boost and preventing decay.
    bool public autoMaxLock = true;

    /// @notice When true, MEZO fees are swapped to MUSD and optionally auto-staked.
    bool public autoStakeMUSD = true;

    /// @notice Optional MUSD Savings Vault; treasury shares are minted here when
    ///         `autoStakeMUSD` is true and this address is non-zero.
    address public musdSavingsVault;

    // ── Security: multi-keeper ────────────────────────────────────────────────

    /// @notice Registry of all currently authorised keeper addresses.
    ///         Multiple keepers may be active simultaneously — this eliminates
    ///         the single-point-of-failure of a single keeper key.
    mapping(address => bool) public authorizedKeepers;

    /// @notice The primary/canonical keeper address shown in status queries and events.
    ///         Always a member of `authorizedKeepers`.
    address public keeper;

    // ── Security: deposit lock period ────────────────────────────────────────

    /// @notice Minimum time (seconds) an NFT must remain in the vault before
    ///         withdrawal is permitted. Prevents flash-loan share manipulation.
    ///         Default: 7 days (one epoch). Configurable via `setMinDepositDuration`.
    uint256 public minDepositDuration = 7 days;

    /// @notice Records the block timestamp at which each tokenId was deposited.
    ///         Used to enforce the deposit lock period.
    mapping(uint256 => uint256) public depositedAt;

    // ── Security: compound cooldown ──────────────────────────────────────────

    /// @notice Minimum seconds between successive compound calls.
    ///         Guards against a compromised keeper spamming `compoundAll()`.
    ///         Default: 1 hour. Configurable via `setMinCompoundInterval`.
    uint256 public minCompoundInterval = 1 hours;

    // ── Security: configurable slippage ──────────────────────────────────────

    /// @notice Slippage tolerance for MEZO → MUSD swaps, in basis points.
    ///         E.g. 100 = 1% maximum deviation from the quoted price.
    ///         Bounded by [MIN_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS].
    uint256 public swapSlippageBps = 100;

    // ── Fee distribution to vveMEZO holders (Phase 3) ────────────────────────

    /// @notice Fraction of collected MUSD fees distributed to vveMEZO holders (bps).
    ///         10000 = 100% to holders, 5000 = 50% to holders + 50% to treasury.
    uint256 public feeDistributionRate = 5000;

    /// @dev Precision multiplier for per-share fee accounting (avoids rounding to zero).
    uint256 private constant PRECISION = 1e18;

    /// @dev Cumulative MUSD fee per vveMEZO share, scaled by PRECISION.
    uint256 public feePerShare;

    /// @dev Per-user reward-debt checkpoint (used to track claimed vs owed fees).
    mapping(address => uint256) public userRewardDebt;

    /// @dev Total MUSD currently sitting in the reward pool (not yet claimed by users).
    uint256 public feePool;

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice Total underlying veMEZO voting-power units managed by the vault.
    uint256 public totalUnderlying;

    /// @notice Unix timestamp of the last successful compoundAll() or compoundBatch() call.
    uint256 public lastCompoundTime;

    /// @notice Cumulative performance fees received in MUSD (18-decimal units).
    uint256 public totalFeesCollectedMusd;

    /// @dev tokenId → original depositor address.
    mapping(uint256 => address) public nftOwner;

    /// @dev user → set of their deposited tokenIds.
    mapping(address => EnumerableSet.UintSet) private _userTokenIds;

    /// @dev Set of all currently deposited tokenIds.
    EnumerableSet.UintSet private _depositedTokenIds;

    // ── Gauge voting state ───────────────────────────────────────────────────

    /// @notice Gauge allocation for voting — each entry maps a gauge address to a
    ///         weight in basis points. Weights must sum ≤ 10000.
    struct GaugeVote {
        address gauge;
        uint256 weight;
    }

    GaugeVote[] public gaugeVotes;

    /// @notice Unix timestamp of the last voteForGauges() call.
    uint256 public lastVoteTime;

    // ── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares);
    event Withdrawn(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares);
    event Compounded(uint256 totalRewards, uint256 fee, uint256 amountCompounded);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    event KeeperAdded(address indexed keeper);
    event KeeperRemoved(address indexed keeper);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event MinDepositValueUpdated(uint256 oldValue, uint256 newValue);
    event MinDepositDurationUpdated(uint256 oldDuration, uint256 newDuration);
    event MinCompoundIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event SwapSlippageUpdated(uint256 oldBps, uint256 newBps);
    event AutoMaxLockUpdated(bool enabled);
    event EmergencyWithdrawal(address indexed user, uint256 indexed tokenId);
    event FeeCollected(uint256 mezoAmount, uint256 musdAmount, address treasury);
    event TreasuryStaked(uint256 musdAmount, uint256 sharesReceived);
    event AutoStakeMUSDUpdated(bool enabled, address savingsVault);
    event FeeDistributed(uint256 totalFee, uint256 toHolders, uint256 toTreasury);
    event FeeDistributionRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardsClaimed(address indexed user, uint256 amount);
    event GaugesVoted(uint256 indexed epochTimestamp, uint256 tokenCount, uint256 gaugeCount);
    event GaugeVotesSet(GaugeVote[] votes);

    // ── Modifiers ────────────────────────────────────────────────────────────

    /// @notice Restricts to any address in the `authorizedKeepers` registry.
    modifier onlyKeeper() {
        if (!authorizedKeepers[msg.sender]) revert Unauthorized(msg.sender);
        _;
    }

    /// @notice Restricts to any authorised keeper or the contract owner.
    modifier onlyKeeperOrOwner() {
        if (!authorizedKeepers[msg.sender] && msg.sender != owner()) revert Unauthorized(msg.sender);
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _veMEZO          Address of the veMEZO NFT contract.
     * @param _gaugeController Address of the Mezo gauge controller.
     * @param _mezoToken       Address of the MEZO ERC-20 token.
     * @param _musdToken       Address of the MUSD ERC-20 token.
     * @param _treasury        Initial treasury address for fee collection.
     * @param _tigrisRouter    Swap router for MEZO → MUSD conversions (address(0) to disable).
     */
    constructor(
        address _veMEZO,
        address _gaugeController,
        address _mezoToken,
        address _musdToken,
        address _treasury,
        address _tigrisRouter
    ) Ownable(msg.sender) {
        if (_veMEZO          == address(0)) revert InvalidAddress();
        if (_gaugeController == address(0)) revert InvalidAddress();
        if (_mezoToken       == address(0)) revert InvalidAddress();
        if (_musdToken       == address(0)) revert InvalidAddress();
        if (_treasury        == address(0)) revert InvalidAddress();

        veMEZO          = IVeMEZO(_veMEZO);
        gaugeController = IGaugeController(_gaugeController);
        mezoToken       = IERC20(_mezoToken);
        musdToken       = IMUSD(_musdToken);
        treasury        = _treasury;
        tigrisRouter    = ITigrisRouter(_tigrisRouter);

        // Deployer starts as both primary keeper and an authorised keeper.
        keeper                      = msg.sender;
        authorizedKeepers[msg.sender] = true;

        vaultToken = new VeMEZOVaultToken(
            "Vault veMEZO Share",
            "vveMEZO",
            address(this),
            _mezoToken
        );
    }

    // ── Deposit ──────────────────────────────────────────────────────────────

    /**
     * @notice Deposit a single veMEZO NFT into the vault and receive vveMEZO shares.
     * @dev    Follows the Checks-Effects-Interactions pattern: all state mutations
     *         are completed before the external safeTransferFrom call.
     *         The deposited NFT is locked for `minDepositDuration` to prevent
     *         flash-loan share manipulation.
     * @param  tokenId  The veMEZO NFT to deposit. Caller must own it.
     * @return shares   The number of vveMEZO shares minted to the caller.
     */
    function deposit(uint256 tokenId)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 shares)
    {
        // ── Checks ───────────────────────────────────────────────────────────
        if (veMEZO.ownerOf(tokenId) != msg.sender) revert NotOwner(tokenId, msg.sender);
        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        if (nftValue < minDepositValue) revert BelowMinimumDeposit(nftValue, minDepositValue);

        // ── Effects ──────────────────────────────────────────────────────────
        _updateRewardDebt(msg.sender);

        nftOwner[tokenId]   = msg.sender;
        depositedAt[tokenId] = block.timestamp;   // [SEC] deposit lock: start timer
        _userTokenIds[msg.sender].add(tokenId);
        _depositedTokenIds.add(tokenId);
        totalUnderlying += nftValue;

        shares = vaultToken.mintShares(msg.sender, nftValue);
        emit Deposited(msg.sender, tokenId, nftValue, shares);

        // ── Interactions ─────────────────────────────────────────────────────
        veMEZO.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    /**
     * @notice Atomically deposit multiple veMEZO NFTs and receive vveMEZO shares.
     * @dev    All ownership checks and state mutations happen before NFT transfers.
     *         Each NFT is individually subject to the deposit lock period.
     * @param  tokenIds    Array of veMEZO tokenIds. Must be non-empty; caller must own each.
     * @return totalShares Total vveMEZO shares minted.
     */
    function depositBatch(uint256[] calldata tokenIds)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 totalShares)
    {
        // ── Checks ───────────────────────────────────────────────────────────
        if (tokenIds.length == 0) revert EmptyBatch();

        // ── Effects ──────────────────────────────────────────────────────────
        _updateRewardDebt(msg.sender);

        uint256 totalValue;
        uint256 len = tokenIds.length;
        for (uint256 i; i < len;) {
            uint256 tid = tokenIds[i];
            if (veMEZO.ownerOf(tid) != msg.sender) revert NotOwner(tid, msg.sender);
            uint256 nftValue = veMEZO.balanceOfNFT(tid);
            if (nftValue < minDepositValue) revert BelowMinimumDeposit(nftValue, minDepositValue);

            nftOwner[tid]    = msg.sender;
            depositedAt[tid] = block.timestamp;   // [SEC] deposit lock: start timer
            _userTokenIds[msg.sender].add(tid);
            _depositedTokenIds.add(tid);

            unchecked { totalValue += nftValue; ++i; }
        }

        totalUnderlying += totalValue;
        totalShares = vaultToken.mintShares(msg.sender, totalValue);

        // Emit per-token events with proportional share allocation.
        for (uint256 i; i < len;) {
            uint256 tid      = tokenIds[i];
            uint256 nftValue = veMEZO.balanceOfNFT(tid);
            uint256 tokenShares = (totalShares * nftValue) / totalValue;
            emit Deposited(msg.sender, tid, nftValue, tokenShares);
            unchecked { ++i; }
        }

        // ── Interactions ─────────────────────────────────────────────────────
        for (uint256 i; i < len;) {
            veMEZO.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            unchecked { ++i; }
        }
    }

    // ── Withdraw ─────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw a specific NFT by tokenId (burns proportional vveMEZO shares).
     * @dev    Pause does not block withdrawals — users can always exit.
     *         Enforces the deposit lock period: if `minDepositDuration` has not
     *         elapsed since deposit, the call reverts with `DepositLocked`.
     * @param  tokenId  The veMEZO NFT to recover. Caller must be the original depositor.
     * @return shares   The number of vveMEZO shares burned.
     */
    function withdraw(uint256 tokenId)
        external
        nonReentrant
        returns (uint256 shares)
    {
        // ── Checks ───────────────────────────────────────────────────────────
        if (nftOwner[tokenId] != msg.sender) revert NotDepositor(tokenId, msg.sender);

        // [SEC] Deposit lock: prevent flash-loan share manipulation.
        uint256 unlockTime = depositedAt[tokenId] + minDepositDuration;
        if (block.timestamp < unlockTime) revert DepositLocked(tokenId, unlockTime, block.timestamp);

        // ── Effects ──────────────────────────────────────────────────────────
        _claimPendingRewards(msg.sender);

        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        shares = vaultToken.convertToShares(nftValue);
        uint256 available = vaultToken.balanceOf(msg.sender);
        if (shares > available) revert InsufficientShares(shares, available);

        delete nftOwner[tokenId];
        delete depositedAt[tokenId];
        _userTokenIds[msg.sender].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;

        uint256 assets = vaultToken.burnShares(msg.sender, shares);
        emit Withdrawn(msg.sender, tokenId, assets, shares);

        // ── Interactions ─────────────────────────────────────────────────────
        veMEZO.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    /**
     * @notice Withdraw the vault NFT whose value best matches the given share amount.
     * @dev    Only considers NFTs whose deposit lock period has elapsed.
     *         Reverts with `NoUnlockedNFT` if all of the caller's NFTs are locked.
     * @param  shares   Amount of vveMEZO shares to redeem.
     * @return tokenId  The NFT returned to the caller.
     */
    function withdrawByShares(uint256 shares)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        // ── Checks ───────────────────────────────────────────────────────────
        if (shares == 0) revert ZeroShares();
        uint256 available = vaultToken.balanceOf(msg.sender);
        if (shares > available) revert InsufficientShares(shares, available);

        // ── Effects ──────────────────────────────────────────────────────────
        _claimPendingRewards(msg.sender);

        // [SEC] Only returns an NFT whose deposit lock has elapsed.
        tokenId = _findWithdrawableNFT(msg.sender, shares);
        if (tokenId == 0) revert NoUnlockedNFT();

        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);
        delete nftOwner[tokenId];
        delete depositedAt[tokenId];
        _userTokenIds[msg.sender].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;

        uint256 assets = vaultToken.burnShares(msg.sender, shares);
        emit Withdrawn(msg.sender, tokenId, assets, shares);

        // ── Interactions ─────────────────────────────────────────────────────
        veMEZO.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    // ── Compounding ──────────────────────────────────────────────────────────

    /**
     * @notice Compound all deposited NFTs (keeper-only).
     *         Claims rebase + gauge rewards, deducts the performance fee, and
     *         re-locks the remainder into each veMEZO position.
     *
     * @dev    Enforces `minCompoundInterval` between calls to prevent a compromised
     *         keeper from spamming this function. For very large vaults, prefer
     *         `compoundBatch()` to avoid block gas-limit issues.
     *
     * @return totalRewards    Sum of all claimed rewards (in MEZO).
     * @return totalFee        Total performance fee deducted (in MEZO).
     * @return totalCompounded Total amount re-locked across all NFTs (in MEZO).
     */
    function compoundAll()
        external
        onlyKeeper
        whenNotPaused
        nonReentrant
        returns (uint256 totalRewards, uint256 totalFee, uint256 totalCompounded)
    {
        // [SEC] Compound cooldown: guard against keeper spam / compromise.
        if (lastCompoundTime != 0 && block.timestamp < lastCompoundTime + minCompoundInterval) {
            revert CompoundTooSoon(lastCompoundTime + minCompoundInterval, block.timestamp);
        }

        uint256[] memory tokenIds = getDepositedTokenIds();
        if (tokenIds.length == 0) revert NoDeposits();

        uint256 len = tokenIds.length;
        for (uint256 i; i < len;) {
            (uint256 r, uint256 f, uint256 c) = _compound(tokenIds[i]);
            unchecked {
                totalRewards    += r;
                totalFee        += f;
                totalCompounded += c;
                ++i;
            }
        }

        totalUnderlying = _calculateTotalUnderlying();
        vaultToken.updateTotalAssets(totalUnderlying);
        lastCompoundTime = block.timestamp;
        emit Compounded(totalRewards, totalFee, totalCompounded);
    }

    /**
     * @notice Compound a paginated slice of deposited NFTs (keeper-only).
     *         Use this for large vaults where `compoundAll()` would exceed the
     *         block gas limit. Call repeatedly with successive `startIndex` values
     *         until the entire vault has been processed.
     *
     * @dev    Does NOT enforce `minCompoundInterval` — callers are expected to
     *         call this multiple times per epoch for different slices.
     *         `lastCompoundTime` is updated on every call so the next
     *         `compoundAll()` is still gated by the cooldown.
     *
     * @param  startIndex  First position in `getDepositedTokenIds()` to process.
     * @param  batchSize   Maximum number of NFTs to process in this call.
     * @return totalRewards    Rewards claimed in this batch.
     * @return totalFee        Fees deducted in this batch.
     * @return totalCompounded Amount re-locked in this batch.
     */
    function compoundBatch(uint256 startIndex, uint256 batchSize)
        external
        onlyKeeper
        whenNotPaused
        nonReentrant
        returns (uint256 totalRewards, uint256 totalFee, uint256 totalCompounded)
    {
        uint256[] memory tokenIds = getDepositedTokenIds();
        if (tokenIds.length == 0) revert NoDeposits();

        uint256 endIndex = startIndex + batchSize;
        if (endIndex > tokenIds.length) endIndex = tokenIds.length;

        for (uint256 i = startIndex; i < endIndex;) {
            (uint256 r, uint256 f, uint256 c) = _compound(tokenIds[i]);
            unchecked {
                totalRewards    += r;
                totalFee        += f;
                totalCompounded += c;
                ++i;
            }
        }

        totalUnderlying = _calculateTotalUnderlying();
        vaultToken.updateTotalAssets(totalUnderlying);
        lastCompoundTime = block.timestamp;
        emit Compounded(totalRewards, totalFee, totalCompounded);
    }

    /**
     * @dev Claim and re-lock rewards for a single NFT.
     *      Uses try/catch for external reward claims so one failed NFT doesn't
     *      block the entire compound run.
     * @param  tokenId   The deposited veMEZO NFT to compound.
     * @return rewards   Total claimed (rebase + incentives) in MEZO.
     * @return fee       Performance fee taken from rewards in MEZO.
     * @return compounded Amount re-locked into the NFT in MEZO.
     */
    function _compound(uint256 tokenId)
        internal
        returns (uint256 rewards, uint256 fee, uint256 compounded)
    {
        if (nftOwner[tokenId] == address(0)) revert TokenNotDeposited(tokenId);

        uint256 rebaseAmount;
        uint256 incentiveAmount;

        // Silently skip failed claims — a missing gauge reward must not block
        // rebase compounding for the same or other NFTs.
        try veMEZO.claimRebase(tokenId)           returns (uint256 a) { rebaseAmount    = a; } catch {}
        try gaugeController.claimRewards(tokenId) returns (uint256 a) { incentiveAmount = a; } catch {}

        rewards = rebaseAmount + incentiveAmount;
        if (rewards == 0) return (0, 0, 0);

        // [SEC] Multiply before divide — no precision loss.
        fee       = (rewards * performanceFee) / 10_000;
        compounded = rewards - fee;

        // ── Fee handling ─────────────────────────────────────────────────────
        if (fee > 0) {
            if (address(tigrisRouter) != address(0)) {
                uint256 musdAmt = _collectFeeInMUSD(fee);
                totalFeesCollectedMusd += musdAmt;
            } else {
                mezoToken.safeTransfer(treasury, fee);
            }
        }

        // ── Re-lock compounded amount ─────────────────────────────────────────
        if (compounded > 0) {
            mezoToken.forceApprove(address(veMEZO), compounded);
            veMEZO.increaseAmount(tokenId, compounded);
            if (autoMaxLock) {
                veMEZO.increaseUnlockTime(tokenId, block.timestamp + MAX_LOCK_DURATION);
            }
            mezoToken.forceApprove(address(veMEZO), 0);
        }
    }

    // ── Fee distribution to vveMEZO holders ──────────────────────────────────

    /**
     * @notice Claim accumulated MUSD fee rewards for the caller.
     *         Rewards are proportional to the caller's vveMEZO balance at each epoch.
     */
    function claimFeeRewards() external nonReentrant {
        uint256 pending = _calculatePendingRewards(msg.sender);
        if (pending == 0) revert NoPendingRewards();
        _claimPendingRewards(msg.sender);
    }

    /**
     * @notice Returns the pending MUSD fee rewards claimable by `user`.
     * @param  user  Address to query.
     * @return       Claimable MUSD amount (18 decimals).
     */
    function pendingFeeRewards(address user) external view returns (uint256) {
        return _calculatePendingRewards(user);
    }

    /**
     * @dev Compute unclaimed MUSD rewards for a user based on per-share accounting.
     */
    function _calculatePendingRewards(address user) internal view returns (uint256) {
        uint256 userShares = vaultToken.balanceOf(user);
        if (userShares == 0) return 0;
        uint256 accumulated = (userShares * feePerShare) / PRECISION;
        uint256 debt        = userRewardDebt[user];
        return accumulated > debt ? accumulated - debt : 0;
    }

    /**
     * @dev Transfer pending rewards to `user` and update their debt checkpoint.
     */
    function _claimPendingRewards(address user) internal {
        uint256 pending = _calculatePendingRewards(user);
        _updateRewardDebt(user);
        if (pending == 0) return;

        feePool -= pending;
        IERC20(address(musdToken)).safeTransfer(user, pending);
        emit RewardsClaimed(user, pending);
    }

    /**
     * @dev Snapshot the user's current reward-debt so future claims start fresh.
     *      Must be called before any share balance change (mint or burn).
     */
    function _updateRewardDebt(address user) internal {
        uint256 userShares   = vaultToken.balanceOf(user);
        userRewardDebt[user] = (userShares * feePerShare) / PRECISION;
    }

    /**
     * @dev Distribute `amount` of MUSD to the holder reward pool.
     *      If there are no holders yet, falls through to the treasury.
     */
    function _distributeToHolders(uint256 amount) internal {
        uint256 totalShares = vaultToken.totalSupply();
        if (totalShares == 0) {
            IERC20(address(musdToken)).safeTransfer(treasury, amount);
            return;
        }
        feePool     += amount;
        feePerShare += (amount * PRECISION) / totalShares;
    }

    // ── View helpers ─────────────────────────────────────────────────────────

    /// @notice Returns an array of all currently deposited veMEZO tokenIds.
    function getDepositedTokenIds() public view returns (uint256[] memory) {
        return _depositedTokenIds.values();
    }

    /// @notice Returns the number of veMEZO NFTs currently held by the vault.
    function getDepositedTokenCount() public view returns (uint256) {
        return _depositedTokenIds.length();
    }

    /// @notice Returns all veMEZO tokenIds deposited by a specific user.
    function getUserTokenIds(address user) public view returns (uint256[] memory) {
        return _userTokenIds[user].values();
    }

    /// @notice Returns the number of NFTs deposited by a specific user.
    function getUserTokenCount(address user) public view returns (uint256) {
        return _userTokenIds[user].length();
    }

    /**
     * @notice Returns the unlock timestamp for a deposited NFT.
     * @param  tokenId  The tokenId to query.
     * @return          Unix timestamp after which the NFT may be withdrawn.
     *                  Returns 0 if the tokenId is not deposited.
     */
    function depositUnlockTime(uint256 tokenId) external view returns (uint256) {
        if (depositedAt[tokenId] == 0) return 0;
        return depositedAt[tokenId] + minDepositDuration;
    }

    /**
     * @notice Returns the total pending gauge incentives claimable across all deposited NFTs.
     * @dev    Approximate — actual claimable amounts may differ at execution time.
     */
    function getPendingRewards() public view returns (uint256 totalPending) {
        uint256[] memory tokenIds = getDepositedTokenIds();
        uint256 len = tokenIds.length;
        for (uint256 i; i < len;) {
            totalPending += gaugeController.pendingRewards(tokenIds[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Returns whether compounding would be profitable at the given gas price.
     * @param  gasPrice  Current network gas price in wei.
     * @return canCompound  True if pending rewards cover gas cost with a 10% margin.
     */
    function checkUpkeep(uint256 gasPrice) public view returns (bool canCompound) {
        // Respect the compound cooldown in the off-chain check too.
        if (lastCompoundTime != 0 && block.timestamp < lastCompoundTime + minCompoundInterval) {
            return false;
        }
        uint256 pending = getPendingRewards();
        if (pending == 0) return false;
        uint256 estimatedGas = 300_000 + (getDepositedTokenCount() * 200_000);
        uint256 gasCost      = gasPrice * estimatedGas;
        return pending > (gasCost * 11) / 10;
    }

    /// @notice Returns the sum of veMEZO voting power across all deposited NFTs.
    function calculateTotalUnderlying() public view returns (uint256) {
        return _calculateTotalUnderlying();
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    function _calculateTotalUnderlying() internal view returns (uint256 total) {
        uint256[] memory tokenIds = getDepositedTokenIds();
        uint256 len = tokenIds.length;
        for (uint256 i; i < len;) {
            total += veMEZO.balanceOfNFT(tokenIds[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @dev Find the user's deposited NFT whose value is closest to the asset value
     *      implied by `shares`, skipping any NFT still within its deposit lock period.
     *      Returns tokenId 0 when no eligible NFT exists.
     */
    function _findWithdrawableNFT(address user, uint256 shares)
        internal
        view
        returns (uint256 bestId)
    {
        uint256 targetValue = vaultToken.convertToAssets(shares);
        uint256 bestDiff    = type(uint256).max;
        uint256[] memory tokens = getUserTokenIds(user);
        uint256 len = tokens.length;
        for (uint256 i; i < len;) {
            uint256 tid = tokens[i];
            // [SEC] Skip NFTs still within the deposit lock period.
            if (block.timestamp < depositedAt[tid] + minDepositDuration) {
                unchecked { ++i; }
                continue;
            }
            uint256 v    = veMEZO.balanceOfNFT(tid);
            uint256 diff = v > targetValue ? v - targetValue : targetValue - v;
            if (diff < bestDiff) {
                bestDiff = diff;
                bestId   = tid;
            }
            unchecked { ++i; }
        }
    }

    /**
     * @dev Swap `feeAmountMezo` of MEZO to MUSD via Tigris, then split the output
     *      between the vveMEZO holder reward pool and the treasury.
     *
     *      Slippage protection: minimum MUSD out is derived from the router's quoted
     *      price minus `swapSlippageBps`, e.g. 100 bps = 1% maximum deviation.
     *      The router quote is an AMM spot price; `swapSlippageBps` must be set
     *      conservatively to account for sandwich-attack risk.
     *
     * @param  feeAmountMezo  MEZO amount to swap.
     * @return musdAmount     MUSD received from the swap.
     */
    function _collectFeeInMUSD(uint256 feeAmountMezo)
        internal
        returns (uint256 musdAmount)
    {
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

        // Always reset approval after use.
        mezoToken.forceApprove(address(tigrisRouter), 0);

        // ── Split MUSD between holder pool and treasury ───────────────────────
        uint256 toHolders  = (musdAmount * feeDistributionRate) / 10_000;
        uint256 toTreasury = musdAmount - toHolders;

        if (toHolders > 0) _distributeToHolders(toHolders);

        if (toTreasury > 0) {
            if (autoStakeMUSD && musdSavingsVault != address(0)) {
                IERC20(address(musdToken)).forceApprove(musdSavingsVault, toTreasury);
                uint256 svShares = IMUSDSavingsVault(musdSavingsVault).deposit(toTreasury, treasury);
                IERC20(address(musdToken)).forceApprove(musdSavingsVault, 0);
                emit TreasuryStaked(toTreasury, svShares);
            } else {
                IERC20(address(musdToken)).safeTransfer(treasury, toTreasury);
            }
        }

        emit FeeCollected(feeAmountMezo, musdAmount, treasury);
        emit FeeDistributed(musdAmount, toHolders, toTreasury);
    }

    /**
     * @dev Compute the minimum acceptable MUSD output for a MEZO → MUSD swap
     *      using the configurable `swapSlippageBps` tolerance.
     *      E.g. swapSlippageBps = 100 → accept up to 1% deviation from quoted price.
     */
    function _minMusdOut(uint256 mezoIn, address[] memory path)
        internal
        view
        returns (uint256)
    {
        uint256[] memory quote   = tigrisRouter.getAmountsOut(mezoIn, path);
        uint256          expected = quote[quote.length - 1];
        // [SEC] Multiply before divide to preserve precision.
        return (expected * (10_000 - swapSlippageBps)) / 10_000;
    }

    // ── Gauge voting ─────────────────────────────────────────────────────────

    /**
     * @notice Configure the gauge allocation used when `voteForGauges` is called.
     * @dev    Weights must sum to ≤ 10000 basis points.
     * @param  votes  Array of (gauge address, weight in bps) pairs.
     */
    function setGaugeVotes(GaugeVote[] calldata votes) external onlyOwner {
        uint256 totalWeight;
        uint256 len = votes.length;
        for (uint256 i; i < len;) {
            if (votes[i].gauge == address(0)) revert InvalidGauge(votes[i].gauge);
            unchecked { totalWeight += votes[i].weight; ++i; }
        }
        if (totalWeight > 10_000) revert InvalidGaugeWeights(totalWeight);

        delete gaugeVotes;
        for (uint256 i; i < len;) {
            gaugeVotes.push(votes[i]);
            unchecked { ++i; }
        }
        emit GaugeVotesSet(votes);
    }

    /**
     * @notice Re-cast votes for every deposited veMEZO NFT across the configured gauges.
     * @dev    Must be called once per epoch (Thursdays ~00:05 UTC) by the keeper.
     *         veMEZO voting power decays linearly — votes must be recast every 7-day epoch.
     *         Individual vote failures are silently ignored so one bad gauge cannot block
     *         the rest.
     */
    function voteForGauges() external onlyKeeperOrOwner {
        uint256 len = gaugeVotes.length;
        if (len == 0) revert NoGaugeVotes();

        uint256[] memory tokenIds = getDepositedTokenIds();
        uint256 tokenCount = tokenIds.length;

        for (uint256 i; i < tokenCount;) {
            for (uint256 j; j < len;) {
                try gaugeController.vote(tokenIds[i], gaugeVotes[j].gauge, gaugeVotes[j].weight) {}
                catch {}
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }

        lastVoteTime = block.timestamp;
        emit GaugesVoted(block.timestamp, tokenCount, len);
    }

    /// @notice Returns the configured gauge vote allocations.
    function getGaugeVotes() external view returns (GaugeVote[] memory) {
        return gaugeVotes;
    }

    // ── Admin — keeper management ────────────────────────────────────────────

    /**
     * @notice Replace the primary keeper with a new address.
     *         The old keeper is removed from the authorised registry; the new
     *         keeper is added. Use `addKeeper`/`removeKeeper` to manage
     *         additional keepers independently.
     * @param  newKeeper  New authorised keeper (EOA, Defender Relayer, etc.).
     */
    function updateKeeper(address newKeeper) external onlyOwner validAddress(newKeeper) {
        if (authorizedKeepers[newKeeper]) revert KeeperAlreadyAuthorized(newKeeper);

        address old = keeper;
        authorizedKeepers[old]      = false;
        authorizedKeepers[newKeeper] = true;
        keeper = newKeeper;

        emit KeeperUpdated(old, newKeeper);
        emit KeeperRemoved(old);
        emit KeeperAdded(newKeeper);
    }

    /**
     * @notice Authorise an additional keeper without replacing the primary one.
     *         Supports multi-keeper architectures (e.g. Gelato + Chainlink + EOA).
     * @param  newKeeper  Address to add to the authorised keeper registry.
     */
    function addKeeper(address newKeeper) external onlyOwner validAddress(newKeeper) {
        if (authorizedKeepers[newKeeper]) revert KeeperAlreadyAuthorized(newKeeper);
        authorizedKeepers[newKeeper] = true;
        emit KeeperAdded(newKeeper);
    }

    /**
     * @notice Remove a keeper from the authorised registry.
     * @dev    If the removed keeper is the primary `keeper`, the primary keeper
     *         field is cleared (set to address(0)). Owner should call `addKeeper`
     *         or `updateKeeper` to assign a new primary.
     * @param  keeperToRemove  Address to remove.
     */
    function removeKeeper(address keeperToRemove) external onlyOwner {
        if (!authorizedKeepers[keeperToRemove]) revert KeeperNotAuthorized(keeperToRemove);
        authorizedKeepers[keeperToRemove] = false;
        if (keeper == keeperToRemove) keeper = address(0);
        emit KeeperRemoved(keeperToRemove);
    }

    // ── Admin — vault parameters ─────────────────────────────────────────────

    /**
     * @notice Update the performance fee.
     * @param  newFee  New fee in basis points (must be within [MIN, MAX] range).
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee < MIN_PERFORMANCE_FEE) revert FeeBelowMinimum(newFee, MIN_PERFORMANCE_FEE);
        if (newFee > MAX_PERFORMANCE_FEE) revert FeeExceedsMaximum(newFee, MAX_PERFORMANCE_FEE);
        emit PerformanceFeeUpdated(performanceFee, newFee);
        performanceFee = newFee;
    }

    /**
     * @notice Update the fraction of fees distributed to vveMEZO holders.
     * @param  newRate  Basis points (0–9000).
     */
    function setFeeDistributionRate(uint256 newRate) external onlyOwner {
        if (newRate > MAX_FEE_DISTRIBUTION_RATE) revert RateExceedsMaximum(newRate, MAX_FEE_DISTRIBUTION_RATE);
        emit FeeDistributionRateUpdated(feeDistributionRate, newRate);
        feeDistributionRate = newRate;
    }

    /**
     * @notice Update the treasury address.
     * @param  newTreasury  Must be non-zero.
     */
    function setTreasury(address newTreasury) external onlyOwner validAddress(newTreasury) {
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @notice Update the minimum NFT value required for deposits.
     * @param  newMin  New minimum in veMEZO voting-power units (18 decimals).
     */
    function setMinDepositValue(uint256 newMin) external onlyOwner {
        emit MinDepositValueUpdated(minDepositValue, newMin);
        minDepositValue = newMin;
    }

    /**
     * @notice Update the minimum time an NFT must remain deposited before withdrawal.
     * @dev    Bounded to [0, MAX_DEPOSIT_DURATION] to prevent governance from
     *         locking funds indefinitely.
     * @param  newDuration  New duration in seconds (0 to disable lock, max 30 days).
     */
    function setMinDepositDuration(uint256 newDuration) external onlyOwner {
        if (newDuration > MAX_DEPOSIT_DURATION) {
            revert InvalidDuration(newDuration, 0, MAX_DEPOSIT_DURATION);
        }
        emit MinDepositDurationUpdated(minDepositDuration, newDuration);
        minDepositDuration = newDuration;
    }

    /**
     * @notice Update the minimum interval between successive compound calls.
     * @dev    Bounded to [0, MAX_COMPOUND_INTERVAL]. Set to 0 to disable.
     * @param  newInterval  New interval in seconds (max 7 days).
     */
    function setMinCompoundInterval(uint256 newInterval) external onlyOwner {
        if (newInterval > MAX_COMPOUND_INTERVAL) {
            revert InvalidDuration(newInterval, 0, MAX_COMPOUND_INTERVAL);
        }
        emit MinCompoundIntervalUpdated(minCompoundInterval, newInterval);
        minCompoundInterval = newInterval;
    }

    /**
     * @notice Update the slippage tolerance for MEZO → MUSD swaps.
     * @dev    Bounded to [MIN_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS].
     *         Lower values reduce MEV surface but may cause swap failures.
     * @param  newBps  Slippage in basis points (e.g. 100 = 1%).
     */
    function setSwapSlippage(uint256 newBps) external onlyOwner {
        if (newBps < MIN_SLIPPAGE_BPS || newBps > MAX_SLIPPAGE_BPS) {
            revert InvalidSlippage(newBps, MIN_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS);
        }
        emit SwapSlippageUpdated(swapSlippageBps, newBps);
        swapSlippageBps = newBps;
    }

    /**
     * @notice Toggle automatic max-lock extension on each compound.
     * @param  enabled  True to extend every NFT's lock to MAX_LOCK_DURATION each epoch.
     */
    function setAutoMaxLock(bool enabled) external onlyOwner {
        autoMaxLock = enabled;
        emit AutoMaxLockUpdated(enabled);
    }

    /**
     * @notice Configure the MUSD auto-stake behaviour.
     * @dev    When `enabled` is true, `savingsVault` must be non-zero — otherwise
     *         the treasury leg of fee distribution would silently have no target.
     * @param  enabled       True to swap fees to MUSD and stake treasury portion.
     * @param  savingsVault  MUSD Savings Vault address (address(0) sends raw MUSD to treasury).
     */
    function setAutoStakeMUSD(bool enabled, address savingsVault) external onlyOwner {
        // [SEC] Guard against enabled=true with zero vault address.
        if (enabled && savingsVault == address(0)) revert InvalidAddress();
        autoStakeMUSD    = enabled;
        musdSavingsVault = savingsVault;
        emit AutoStakeMUSDUpdated(enabled, savingsVault);
    }

    /// @notice Pause all deposits and compounding (withdrawals remain open).
    function pause()   external onlyOwner { _pause(); }

    /// @notice Unpause the vault.
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency withdrawal of a specific NFT to an arbitrary address.
     * @dev    Owner-only. Bypasses the deposit lock period — intended only for
     *         genuine recovery scenarios (e.g. user lost wallet access).
     *         Burns the depositor's corresponding shares.
     * @param  tokenId  The deposited NFT to recover.
     * @param  to       Recipient address.
     */
    function emergencyWithdraw(uint256 tokenId, address to)
        external
        onlyOwner
        nonReentrant          // [SEC] Added: guards against reentrancy on external NFT transfer.
        validAddress(to)
    {
        if (nftOwner[tokenId] == address(0)) revert TokenNotDeposited(tokenId);

        address user     = nftOwner[tokenId];
        uint256 nftValue = veMEZO.balanceOfNFT(tokenId);

        // ── Effects ──────────────────────────────────────────────────────────
        delete nftOwner[tokenId];
        delete depositedAt[tokenId];
        _userTokenIds[user].remove(tokenId);
        _depositedTokenIds.remove(tokenId);
        totalUnderlying -= nftValue;

        uint256 shares = vaultToken.convertToShares(nftValue);
        vaultToken.burnShares(user, shares);

        emit EmergencyWithdrawal(user, tokenId);

        // ── Interactions ─────────────────────────────────────────────────────
        veMEZO.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Accept veMEZO NFT transfers.
     *      Only the veMEZO contract may send NFTs to this vault.
     *      The `nonReentrant` guard is on the calling `deposit` / `depositBatch`
     *      functions, so the callback itself does not re-enter the vault.
     */
    function onERC721Received(address, address, uint256, bytes calldata)
        external
        view
        override
        returns (bytes4)
    {
        if (msg.sender != address(veMEZO)) revert UnauthorizedNFT(msg.sender);
        return this.onERC721Received.selector;
    }
}
