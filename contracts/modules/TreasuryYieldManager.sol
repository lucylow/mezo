// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IMUSDSavingsVault.sol";

/**
 * @title TreasuryYieldManager
 * @notice Routes protocol MUSD across yield allocations (native savings vault + placeholders for external venues).
 */
contract TreasuryYieldManager is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable musdToken;
    IMUSDSavingsVault public immutable musdSavingsVault;

    struct StrategyAllocation {
        uint256 savingsVault;
        uint256 curvePool;
        uint256 aerodromePool;
        uint256 idle;
    }

    StrategyAllocation public allocation = StrategyAllocation({
        savingsVault: 5000,
        curvePool: 2000,
        aerodromePool: 2000,
        idle: 1000
    });

    address public curvePoolAddress;
    address public aerodromePoolAddress;

    uint256 public savingsVaultShares;

    event YieldHarvested(uint256 totalAssets, uint256 yield);
    event StrategyRebalanced(StrategyAllocation oldAlloc, StrategyAllocation newAlloc);
    event DepositedToStrategy(string strategy, uint256 amount);

    constructor(address _musdToken, address _savingsVault, address initialOwner) Ownable(initialOwner) {
        require(_musdToken != address(0) && _savingsVault != address(0), "TreasuryYieldManager: zero addr");
        musdToken = IERC20(_musdToken);
        musdSavingsVault = IMUSDSavingsVault(_savingsVault);
    }

    /**
     * @notice Deploy idle MUSD on this contract according to `allocation`.
     * @dev Curve / Aerodrome legs are emitted for off-chain keepers until routers are wired.
     */
    function deployTreasury(uint256 totalAmount) external onlyOwner nonReentrant {
        require(musdToken.balanceOf(address(this)) >= totalAmount, "TreasuryYieldManager: insufficient balance");

        uint256 toSavings = (totalAmount * allocation.savingsVault) / 10_000;
        uint256 toCurve = (totalAmount * allocation.curvePool) / 10_000;
        uint256 toAerodrome = (totalAmount * allocation.aerodromePool) / 10_000;

        if (toSavings > 0) {
            musdToken.forceApprove(address(musdSavingsVault), toSavings);
            uint256 shares = musdSavingsVault.deposit(toSavings, address(this));
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

    function harvestAll() external onlyOwner nonReentrant returns (uint256 totalYield) {
        uint256 beforeBalance = getTotalValue();
        uint256 afterBalance = getTotalValue();
        totalYield = afterBalance > beforeBalance ? afterBalance - beforeBalance : 0;
        emit YieldHarvested(afterBalance, totalYield);
    }

    function getTotalValue() public view returns (uint256 total) {
        total += musdToken.balanceOf(address(this));
        total += musdSavingsVault.convertToAssets(savingsVaultShares);
    }

    function setAllocation(StrategyAllocation calldata newAlloc) external onlyOwner {
        require(
            newAlloc.savingsVault + newAlloc.curvePool + newAlloc.aerodromePool + newAlloc.idle == 10_000,
            "TreasuryYieldManager: allocation != 100%"
        );
        emit StrategyRebalanced(allocation, newAlloc);
        allocation = newAlloc;
    }

    function setCurvePool(address _curvePool) external onlyOwner {
        curvePoolAddress = _curvePool;
    }

    function setAerodromePool(address _aerodromePool) external onlyOwner {
        aerodromePoolAddress = _aerodromePool;
    }
}
