// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title VaultTimelockController
 * @notice Timelock that gates all admin parameter changes on the vault.
 *
 * Default minimum delay: 2 days, configurable by governance.
 * The VaultGovernor is granted PROPOSER_ROLE and EXECUTOR_ROLE so that
 * passed proposals can queue and execute changes through the timelock.
 */
contract VaultTimelockController is TimelockController {

    /**
     * @param minDelay   Initial minimum delay in seconds (e.g. 172800 = 2 days).
     * @param proposers  Addresses allowed to schedule operations (e.g. governor).
     * @param executors  Addresses allowed to execute operations (e.g. governor, address(0) for open).
     * @param admin      Optional admin that can manage roles; set to address(0) to self-administer.
     */
    constructor(
        uint256          minDelay,
        address[] memory proposers,
        address[] memory executors,
        address          admin
    )
        TimelockController(minDelay, proposers, executors, admin)
    {}
}
