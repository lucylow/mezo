// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IGaugeController.sol";

/**
 * @title MockGaugeController
 * @notice Minimal GaugeController mock for unit tests.
 *
 * Allows the test suite to set arbitrary pending rewards per token ID
 * and simulate reward claims.
 */
contract MockGaugeController is IGaugeController {
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;

    mapping(uint256 => uint256) public pendingRewardsMap;
    mapping(uint256 => address) public gaugeVotes;

    struct GaugeInfo {
        uint256 totalWeight;
        uint256 rewardRate;
        uint256 periodFinish;
    }
    mapping(address => GaugeInfo) private _gauges;
    address[] private _activeGauges;

    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }

    function claimRewards(uint256 tokenId) external override returns (uint256 amount) {
        amount = pendingRewardsMap[tokenId];
        pendingRewardsMap[tokenId] = 0;
        if (amount > 0) {
            rewardToken.safeTransfer(msg.sender, amount);
        }
    }

    function claimRewardsForGauge(uint256 tokenId, address) external override returns (uint256 amount) {
        amount = pendingRewardsMap[tokenId];
        pendingRewardsMap[tokenId] = 0;
        if (amount > 0) {
            rewardToken.safeTransfer(msg.sender, amount);
        }
    }

    function pendingRewards(uint256 tokenId) external view override returns (uint256) {
        return pendingRewardsMap[tokenId];
    }

    function vote(uint256 tokenId, address gauge, uint256) external override {
        gaugeVotes[tokenId] = gauge;
    }

    function gauges(address gauge) external view override returns (
        uint256 totalWeight,
        uint256 rewardRate,
        uint256 periodFinish
    ) {
        GaugeInfo storage g = _gauges[gauge];
        return (g.totalWeight, g.rewardRate, g.periodFinish);
    }

    function getActiveGauges() external view override returns (address[] memory) {
        return _activeGauges;
    }

    // ── Test helpers ──────────────────────────────────────────────────────────

    function setPendingRewards(uint256 tokenId, uint256 amount) external {
        pendingRewardsMap[tokenId] = amount;
    }

    function addGauge(address gauge, uint256 totalWeight, uint256 rewardRate, uint256 periodFinish) external {
        _gauges[gauge] = GaugeInfo(totalWeight, rewardRate, periodFinish);
        _activeGauges.push(gauge);
    }
}
