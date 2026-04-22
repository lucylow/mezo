// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IGaugeController {
    function vote(uint256 tokenId, address gauge, uint256 weight) external;
    function claimRewards(uint256 tokenId) external returns (uint256 amount);
    function claimRewardsForGauge(uint256 tokenId, address gauge) external returns (uint256 amount);
    function pendingRewards(uint256 tokenId) external view returns (uint256 amount);
    function gauges(address gauge) external view returns (
        uint256 totalWeight,
        uint256 rewardRate,
        uint256 periodFinish
    );
    function getActiveGauges() external view returns (address[] memory);
}
