// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title  IGaugeController
 * @notice Interface for the Mezo Earn gauge controller contract.
 *
 *         The gauge system distributes incentives ("bribes") posted by veBTC holders
 *         to veMEZO positions that vote for their gauge. This is the primary yield
 *         source for the VeMEZOAutoCompounder vault.
 *
 *         Epoch timing: votes cast in epoch N determine rewards for epoch N+1.
 *         Rewards generated in epoch N are claimable at the start of epoch N+1
 *         (every Thursday at 00:00 UTC).
 */
interface IGaugeController {
    /**
     * @notice Cast a vote for a gauge from a veMEZO position.
     * @dev    Must be called each epoch — voting power is not persistent.
     * @param  tokenId  ID of the voting veMEZO NFT.
     * @param  gauge    Address of the target gauge.
     * @param  weight   Vote weight in basis points (0–10000).
     */
    function vote(uint256 tokenId, address gauge, uint256 weight) external;

    /**
     * @notice Claim all pending gauge incentives for a veMEZO position.
     * @param  tokenId  ID of the veMEZO NFT whose rewards are being claimed.
     * @return amount   Total MEZO-equivalent incentives claimed (18-decimal units).
     */
    function claimRewards(uint256 tokenId) external returns (uint256 amount);

    /**
     * @notice Claim incentives accrued for a specific gauge from a veMEZO position.
     * @param  tokenId  ID of the veMEZO NFT.
     * @param  gauge    Address of the specific gauge to claim from.
     * @return amount   Incentives claimed for that gauge (18-decimal units).
     */
    function claimRewardsForGauge(uint256 tokenId, address gauge) external returns (uint256 amount);

    /**
     * @notice Returns the total pending incentives claimable by a veMEZO position.
     * @dev    Used by `checkUpkeep` to determine if compounding is economically viable.
     * @param  tokenId  ID of the veMEZO NFT.
     * @return amount   Pending incentives (18-decimal units).
     */
    function pendingRewards(uint256 tokenId) external view returns (uint256 amount);

    /**
     * @notice Returns the state of a gauge.
     * @param  gauge        Address of the gauge to query.
     * @return totalWeight  Cumulative vote weight directed at this gauge.
     * @return rewardRate   Current incentive emission rate (per second).
     * @return periodFinish Unix timestamp when the current incentive period ends.
     */
    function gauges(address gauge) external view returns (
        uint256 totalWeight,
        uint256 rewardRate,
        uint256 periodFinish
    );

    /// @notice Returns all gauges with active (non-expired) incentive periods.
    function getActiveGauges() external view returns (address[] memory);
}
