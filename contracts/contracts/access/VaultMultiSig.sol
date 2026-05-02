// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  VaultMultiSig
 * @notice M-of-N multi-signature access control for vault emergency functions.
 *
 *         Guardians propose and approve emergency actions (e.g. pause, emergency
 *         withdraw). An action executes only when it has accumulated the required
 *         number of approvals and has not expired.
 *
 *         This replaces single-`onlyOwner` emergency controls, requiring consensus
 *         from multiple trusted parties before any sensitive operation is run.
 */
contract VaultMultiSig is AccessControl {

    // ── Custom errors ────────────────────────────────────────────────────────

    error NoGuardians();
    error MinOneRequired();
    error RequiredExceedsTotal(uint256 required, uint256 total);
    error InvalidTarget();
    error ActionAlreadyExists(bytes32 actionId);
    error UnknownAction(bytes32 actionId);
    error AlreadyExecuted(bytes32 actionId);
    error AlreadyApproved(bytes32 actionId, address guardian);
    error NotApproved(bytes32 actionId, address guardian);
    error ActionExpired(bytes32 actionId);
    error InsufficientApprovals(uint256 current, uint256 required);
    error ExecutionFailed(bytes returnData);
    error WindowTooShort(uint256 provided, uint256 minimum);
    error WindowTooLong(uint256 provided, uint256 maximum);
    error MinRequired();

    // ── Roles ────────────────────────────────────────────────────────────────

    bytes32 public constant GUARDIAN_ROLE  = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // ── Config ───────────────────────────────────────────────────────────────

    /// @notice Number of guardian approvals required to execute an action.
    uint256 public requiredGuardians;

    /// @notice Window (seconds) within which an approved action must be executed.
    uint256 public actionWindow = 24 hours;

    // ── Emergency action ─────────────────────────────────────────────────────

    struct EmergencyAction {
        address target;
        bytes   data;
        uint256 timestamp;
        uint256 approvalCount;
        bool    executed;
        mapping(address => bool) approvals;
    }

    mapping(bytes32 => EmergencyAction) public emergencyActions;

    // ── Events ───────────────────────────────────────────────────────────────

    event EmergencyActionProposed(bytes32 indexed actionId, address indexed proposer, address target);
    event EmergencyActionApproved(bytes32 indexed actionId, address indexed guardian);
    event EmergencyActionRevoked(bytes32 indexed actionId, address indexed guardian);
    event EmergencyActionExecuted(bytes32 indexed actionId);
    event RequiredGuardiansUpdated(uint256 oldValue, uint256 newValue);
    event ActionWindowUpdated(uint256 oldWindow, uint256 newWindow);

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param guardians          Initial guardian addresses.
     * @param _requiredGuardians Number of approvals required to execute an action.
     */
    constructor(address[] memory guardians, uint256 _requiredGuardians) {
        if (guardians.length == 0)                       revert NoGuardians();
        if (_requiredGuardians < 1)                      revert MinOneRequired();
        if (_requiredGuardians > guardians.length)       revert RequiredExceedsTotal(_requiredGuardians, guardians.length);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        uint256 len = guardians.length;
        for (uint256 i; i < len;) {
            _grantRole(GUARDIAN_ROLE, guardians[i]);
            unchecked { ++i; }
        }

        requiredGuardians = _requiredGuardians;
    }

    // ── Proposal lifecycle ────────────────────────────────────────────────────

    /**
     * @notice Propose a new emergency action.
     * @param  target   Contract address to call.
     * @param  data     ABI-encoded function call.
     * @return actionId Unique hash identifying this action.
     */
    function proposeEmergencyAction(address target, bytes calldata data)
        external
        onlyRole(GUARDIAN_ROLE)
        returns (bytes32 actionId)
    {
        if (target == address(0)) revert InvalidTarget();
        actionId = keccak256(abi.encodePacked(target, data, block.timestamp, msg.sender));

        EmergencyAction storage action = emergencyActions[actionId];
        if (action.timestamp != 0) revert ActionAlreadyExists(actionId);

        action.target    = target;
        action.data      = data;
        action.timestamp = block.timestamp;

        emit EmergencyActionProposed(actionId, msg.sender, target);
    }

    /**
     * @notice Approve a pending emergency action.
     * @param  actionId  ID returned by proposeEmergencyAction().
     */
    function approveEmergencyAction(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        if (action.timestamp == 0)                                          revert UnknownAction(actionId);
        if (action.executed)                                                revert AlreadyExecuted(actionId);
        if (action.approvals[msg.sender])                                   revert AlreadyApproved(actionId, msg.sender);
        if (block.timestamp > action.timestamp + actionWindow)              revert ActionExpired(actionId);

        action.approvals[msg.sender] = true;
        unchecked { action.approvalCount++; }

        emit EmergencyActionApproved(actionId, msg.sender);
    }

    /**
     * @notice Revoke a previously given approval.
     * @param  actionId  ID of the action to un-approve.
     */
    function revokeApproval(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        if (action.executed)                    revert AlreadyExecuted(actionId);
        if (!action.approvals[msg.sender])      revert NotApproved(actionId, msg.sender);

        action.approvals[msg.sender] = false;
        unchecked { action.approvalCount--; }

        emit EmergencyActionRevoked(actionId, msg.sender);
    }

    /**
     * @notice Execute an action that has reached the required approval count.
     * @param  actionId  ID of the approved action to execute.
     */
    function executeEmergencyAction(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        if (action.timestamp == 0)                                      revert UnknownAction(actionId);
        if (action.executed)                                            revert AlreadyExecuted(actionId);
        if (action.approvalCount < requiredGuardians)                   revert InsufficientApprovals(action.approvalCount, requiredGuardians);
        if (block.timestamp > action.timestamp + actionWindow)          revert ActionExpired(actionId);

        action.executed = true;

        (bool success, bytes memory returnData) = action.target.call(action.data);
        if (!success) revert ExecutionFailed(returnData);

        emit EmergencyActionExecuted(actionId);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    /// @notice Returns whether `guardian` has approved `actionId`.
    function hasApproved(bytes32 actionId, address guardian) external view returns (bool) {
        return emergencyActions[actionId].approvals[guardian];
    }

    /// @notice Returns the number of approvals accumulated for `actionId`.
    function getApprovalCount(bytes32 actionId) external view returns (uint256) {
        return emergencyActions[actionId].approvalCount;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * @notice Update the number of guardian approvals required.
     * @param  newRequired  Must be ≥ 1.
     */
    function setRequiredGuardians(uint256 newRequired) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRequired < 1) revert MinRequired();
        emit RequiredGuardiansUpdated(requiredGuardians, newRequired);
        requiredGuardians = newRequired;
    }

    /**
     * @notice Update the execution window for approved actions.
     * @param  newWindow  Must be between 1 hour and 7 days.
     */
    function setActionWindow(uint256 newWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newWindow < 1 hours) revert WindowTooShort(newWindow, 1 hours);
        if (newWindow > 7 days)  revert WindowTooLong(newWindow, 7 days);
        emit ActionWindowUpdated(actionWindow, newWindow);
        actionWindow = newWindow;
    }
}
