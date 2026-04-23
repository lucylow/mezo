// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title VaultGovernor
 * @notice On-chain governance for the veMEZO Auto-Compounder Vault.
 *
 * Voting power is derived from vveMEZO shares (the ERC-20 vault token).
 * All vault parameter changes (performance fee, treasury, keeper, etc.)
 * must pass through this governor → timelock before taking effect.
 *
 * Default parameters (adjustable via proposal):
 * ─────────────────────────────────────────────
 *  Voting delay   : 1 day  (~7 200 blocks at 12s)
 *  Voting period  : 5 days (~36 000 blocks)
 *  Proposal threshold: 10 000 vveMEZO
 *  Quorum         : 100 000 vveMEZO (1% of typical supply)
 *  Timelock delay : 2 days (enforced by VaultTimelockController)
 */
contract VaultGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorTimelockControl
{
    /// @notice Fixed quorum in vveMEZO (18 decimals).
    uint256 public quorumAmount;

    event QuorumAmountUpdated(uint256 oldQuorum, uint256 newQuorum);

    constructor(
        IVotes               _token,
        TimelockController   _timelock,
        uint48               _votingDelay,
        uint32               _votingPeriod,
        uint256              _proposalThreshold,
        uint256              _quorumAmount
    )
        Governor("VaultGovernor")
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {
        require(_quorumAmount > 0, "Quorum cannot be zero");
        quorumAmount = _quorumAmount;
    }

    // ── Quorum ────────────────────────────────────────────────────────────────

    function quorum(uint256 /* blockNumber */) public view override returns (uint256) {
        return quorumAmount;
    }

    /// @notice Update quorum — can only be called through a governance proposal.
    function updateQuorumAmount(uint256 newQuorum) external onlyGovernance {
        require(newQuorum > 0, "Quorum cannot be zero");
        emit QuorumAmountUpdated(quorumAmount, newQuorum);
        quorumAmount = newQuorum;
    }

    // ── Required overrides ────────────────────────────────────────────────────

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
