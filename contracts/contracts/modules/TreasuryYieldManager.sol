// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IMUSDSavingsVault.sol";

/**
 * @title  TreasuryYieldManager
 * @notice Routes protocol MUSD across yield strategies to maximise treasury returns.
 *
 *         The vault's performance fees (collected in MUSD) are sent here. This
 *         contract deploys idle MUSD into configured yield venues according to the
 *         `allocation` weights. Currently supports:
 *          • MUSD Savings Vault (native Mezo integration)
 *          • Curve and Aerodrome pool legs (enabled when addresses are configured)
 *
 * @dev    Allocation weights must sum to exactly 10 000 basis points (100%).
 */
contract TreasuryYieldManager is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Custom errors ────────────────────────────────────────────────────────

    error InvalidAddress();
    error InsufficientBalance(uint256 requested, uint256 available);
    error AllocationMustSum10000(uint256 actual);

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice MUSD stablecoin managed by this contract.
    IERC20 public immutable musdToken;

    /// @notice Mezo MUSD Savings Vault — the primary native yield venue.
    IMUSDSavingsVault public immutable musdSavingsVault;

    // ── Config ───────────────────────────────────────────────────────────────

    struct StrategyAllocation {
        uint256 savingsVault;   // basis points → native MUSD Savings Vault
        uint256 curvePool;      // basis points → Curve stable pool
        uint256 aerodromePool;  // basis points → Aerodrome LP
        uint256 idle;           // basis points → kept idle on this contract
    }

    /// @notice Current allocation weights. Must always sum to 10 000.
    StrategyAllocation public allocation = StrategyAllocation({
        savingsVault:  5000,
        curvePool:     2000,
        aerodromePool: 2000,
        idle:          1000
    });

    /// @notice Curve stable-pool address (optional; deploy leg skipped when zero).
    address public curvePoolAddress;

    /// @notice Aerodrome LP address (optional; deploy leg skipped when zero).
    address public aerodromePoolAddress;

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice sMUSD shares currently held by this contract in the savings vault.
    uint256 public savingsVaultShares;

    /// @notice Snapshot of total value taken at the start of the last harvestAll().
    uint256 private _lastHarvestValue;

    // ── Events ───────────────────────────────────────────────────────────────

    event YieldHarvested(uint256 totalAssets, uint256 yield);
    event StrategyRebalanced(StrategyAllocation oldAlloc, StrategyAllocation newAlloc);
    event DepositedToStrategy(string strategy, uint256 amount);

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _musdToken    Address of the MUSD ERC-20 token.
     * @param _savingsVault Address of the MUSD Savings Vault.
     * @param initialOwner  Initial owner (typically the deployer multisig).
     */
    constructor(
        address _musdToken,
        address _savingsVault,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_musdToken    == address(0)) revert InvalidAddress();
        if (_savingsVault == address(0)) revert InvalidAddress();
        musdToken        = IERC20(_musdToken);
        musdSavingsVault = IMUSDSavingsVault(_savingsVault);
    }

    // ── Core ─────────────────────────────────────────────────────────────────

    /**
     * @notice Deploy idle MUSD on this contract according to `allocation` weights.
     * @dev    Curve/Aerodrome legs emit events but do not transfer tokens until
     *         the respective router addresses are configured.
     * @param  totalAmount  MUSD amount to deploy (must be held by this contract).
     */
    function deployTreasury(uint256 totalAmount) external onlyOwner nonReentrant {
        uint256 bal = musdToken.balanceOf(address(this));
        if (bal < totalAmount) revert InsufficientBalance(totalAmount, bal);

        uint256 toSavings   = (totalAmount * allocation.savingsVault)   / 10_000;
        uint256 toCurve     = (totalAmount * allocation.curvePool)      / 10_000;
        uint256 toAerodrome = (totalAmount * allocation.aerodromePool)  / 10_000;

        if (toSavings > 0) {
            musdToken.forceApprove(address(musdSavingsVault), toSavings);
            uint256 shares = musdSavingsVault.deposit(toSavings, address(this));
            musdToken.forceApprove(address(musdSavingsVault), 0);
            savingsVaultShares += shares;
            emit DepositedToStrategy("savingsVault", toSavings);
        }

        if (toCurve > 0 && curvePoolAddress != address(0)) {
            emit DepositedToStrategy("curvePool", toCurve);
        }

        if (toAerodrome > 0 && aerodromePoolAddress != address(0)) {
            emit DepositedToStrategy("aerodromePool", toAerodrome);
        }
    }

    /**
     * @notice Measure yield generated since the last harvest snapshot.
     * @dev    Compares total vault value before and after any pending rewards are
     *         realised. Updates `_lastHarvestValue` for the next call.
     * @return totalYield  MUSD gain since the last call to harvestAll().
     */
    function harvestAll() external onlyOwner nonReentrant returns (uint256 totalYield) {
        uint256 beforeValue = _lastHarvestValue == 0 ? getTotalValue() : _lastHarvestValue;
        uint256 afterValue  = getTotalValue();
        totalYield          = afterValue > beforeValue ? afterValue - beforeValue : 0;
        _lastHarvestValue   = afterValue;
        emit YieldHarvested(afterValue, totalYield);
    }

    // ── View helpers ─────────────────────────────────────────────────────────

    /**
     * @notice Returns the total MUSD value managed by this contract.
     *         Includes idle MUSD on this address plus the redeemable value of sMUSD shares.
     */
    function getTotalValue() public view returns (uint256 total) {
        total  = musdToken.balanceOf(address(this));
        total += musdSavingsVault.convertToAssets(savingsVaultShares);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * @notice Update strategy allocation weights.
     * @dev    All four weights must sum to exactly 10 000 basis points.
     * @param  newAlloc  New allocation configuration.
     */
    function setAllocation(StrategyAllocation calldata newAlloc) external onlyOwner {
        uint256 total = newAlloc.savingsVault + newAlloc.curvePool +
                        newAlloc.aerodromePool + newAlloc.idle;
        if (total != 10_000) revert AllocationMustSum10000(total);
        emit StrategyRebalanced(allocation, newAlloc);
        allocation = newAlloc;
    }

    /**
     * @notice Set the Curve stable pool address for the Curve yield leg.
     * @param  _curvePool  New Curve pool address (address(0) to disable).
     */
    function setCurvePool(address _curvePool) external onlyOwner {
        curvePoolAddress = _curvePool;
    }

    /**
     * @notice Set the Aerodrome LP address for the Aerodrome yield leg.
     * @param  _aerodromePool  New Aerodrome pool address (address(0) to disable).
     */
    function setAerodromePool(address _aerodromePool) external onlyOwner {
        aerodromePoolAddress = _aerodromePool;
    }
}
