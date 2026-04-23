// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VaultMultiSig
 * @notice M-of-N multi-signature access control for vault emergency functions.
 *
 * Guardians propose and approve emergency actions (e.g. pause, emergency
 * withdraw). An action is executed only when it has accumulated enough
 * approvals and has not expired.
 *
 * This replaces the single `onlyOwner` emergency controls, requiring
 * consensus from multiple trusted parties before a sensitive operation runs.
 */
contract VaultMultiSig is AccessControl {

    // ── Roles ─────────────────────────────────────────────────────────────────

    bytes32 public constant GUARDIAN_ROLE  = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // ── Config ────────────────────────────────────────────────────────────────

    /// @notice Number of guardian approvals required to execute an action.
    uint256 public requiredGuardians;

    /// @notice Window (seconds) within which an approved action must be executed.
    uint256 public actionWindow = 24 hours;

    // ── Emergency action ─────────────────────────────────────────────────────

    struct EmergencyAction {
        address   target;
        bytes     data;
        uint256   timestamp;
        uint256   approvalCount;
        bool      executed;
        mapping(address => bool) approvals;
    }

    mapping(bytes32 => EmergencyAction) public emergencyActions;

    // ── Events ────────────────────────────────────────────────────────────────

    event EmergencyActionProposed(bytes32 indexed actionId, address indexed proposer, address target);
    event EmergencyActionApproved(bytes32 indexed actionId, address indexed guardian);
    event EmergencyActionRevoked(bytes32 indexed actionId, address indexed guardian);
    event EmergencyActionExecuted(bytes32 indexed actionId);
    event RequiredGuardiansUpdated(uint256 oldValue, uint256 newValue);

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param guardians         Initial guardian addresses.
     * @param _requiredGuardians Number of approvals required.
     */
    constructor(address[] memory guardians, uint256 _requiredGuardians) {
        require(guardians.length > 0,              "No guardians");
        require(_requiredGuardians >= 1,           "Min 1 required");
        require(_requiredGuardians <= guardians.length, "Required > total");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        for (uint256 i = 0; i < guardians.length; i++) {
            _grantRole(GUARDIAN_ROLE, guardians[i]);
        }

        requiredGuardians = _requiredGuardians;
    }

    // ── Proposal lifecycle ────────────────────────────────────────────────────

    /**
     * @notice Propose a new emergency action.
     * @param target Contract to call.
     * @param data   Encoded function call.
     * @return actionId Hash identifying this action.
     */
    function proposeEmergencyAction(
        address      target,
        bytes calldata data
    )
        external
        onlyRole(GUARDIAN_ROLE)
        returns (bytes32 actionId)
    {
        require(target != address(0), "Invalid target");
        actionId = keccak256(abi.encodePacked(target, data, block.timestamp, msg.sender));

        EmergencyAction storage action = emergencyActions[actionId];
        require(action.timestamp == 0, "Action already exists");

        action.target    = target;
        action.data      = data;
        action.timestamp = block.timestamp;

        emit EmergencyActionProposed(actionId, msg.sender, target);
    }

    /**
     * @notice Approve a pending emergency action.
     */
    function approveEmergencyAction(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        require(action.timestamp != 0,           "Unknown action");
        require(!action.executed,                "Already executed");
        require(!action.approvals[msg.sender],   "Already approved");
        require(block.timestamp <= action.timestamp + actionWindow, "Expired");

        action.approvals[msg.sender] = true;
        action.approvalCount++;

        emit EmergencyActionApproved(actionId, msg.sender);
    }

    /**
     * @notice Revoke a previously given approval.
     */
    function revokeApproval(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        require(!action.executed,              "Already executed");
        require(action.approvals[msg.sender],  "Not approved");

        action.approvals[msg.sender] = false;
        action.approvalCount--;

        emit EmergencyActionRevoked(actionId, msg.sender);
    }

    /**
     * @notice Execute an action that has reached the required approval count.
     */
    function executeEmergencyAction(bytes32 actionId) external onlyRole(GUARDIAN_ROLE) {
        EmergencyAction storage action = emergencyActions[actionId];
        require(action.timestamp != 0,           "Unknown action");
        require(!action.executed,                "Already executed");
        require(action.approvalCount >= requiredGuardians, "Insufficient approvals");
        require(block.timestamp <= action.timestamp + actionWindow, "Expired");

        action.executed = true;

        (bool success, bytes memory returnData) = action.target.call(action.data);
        if (!success) {
            assembly { revert(add(returnData, 32), mload(returnData)) }
        }

        emit EmergencyActionExecuted(actionId);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    function hasApproved(bytes32 actionId, address guardian) external view returns (bool) {
        return emergencyActions[actionId].approvals[guardian];
    }

    function getApprovalCount(bytes32 actionId) external view returns (uint256) {
        return emergencyActions[actionId].approvalCount;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setRequiredGuardians(uint256 newRequired) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRequired >= 1, "Min 1");
        emit RequiredGuardiansUpdated(requiredGuardians, newRequired);
        requiredGuardians = newRequired;
    }

    function setActionWindow(uint256 newWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWindow >= 1 hours,  "Min 1 hour");
        require(newWindow <= 7 days,   "Max 7 days");
        actionWindow = newWindow;
    }
}
