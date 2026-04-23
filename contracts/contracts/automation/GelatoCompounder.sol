// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "../VeMEZOAutoCompounder.sol";

/// @dev Minimal Gelato Automate interface (resolver-pattern, no external import needed).
interface IAutomate {
    enum Module { RESOLVER, TIME, PROXY, SINGLE_EXEC }
    struct ModuleData {
        Module[] modules;
        bytes[]  args;
    }
    function createTask(
        address execAddress,
        bytes calldata execDataOrSelector,
        ModuleData calldata moduleData,
        address feeToken
    ) external returns (bytes32 taskId);
    function cancelTask(bytes32 taskId) external;
    function getFeeDetails() external view returns (uint256 fee, address feeToken);
}

/**
 * @title GelatoCompounder
 * @notice Gelato-compatible resolver + executor for decentralized compounding.
 *
 * Replaces the single centralised keeper bot with a decentralised executor
 * network. Gelato nodes call `checker()` off-chain; if it returns canExec=true
 * they call `executeCompound()` on-chain.
 *
 * Deployment steps
 * ────────────────
 * 1. Deploy this contract.
 * 2. Fund it with a small ETH/native balance for Gelato fee payment.
 * 3. Call `createTask()` — Gelato registers the resolver-based task.
 * 4. Call `vault.updateKeeper(address(this))` to authorise this contract.
 */
contract GelatoCompounder {

    // ── State ───────────────────────────────────────────────────────────────

    VeMEZOAutoCompounder public immutable vault;
    IAutomate             public immutable automate;

    /// @notice Gelato task identifier (set after createTask()).
    bytes32 public taskId;

    /// @notice Minimum seconds between compounds (default 6 hours).
    uint256 public minInterval = 6 hours;

    uint256 public lastExecution;

    address public owner;

    // ── Events ──────────────────────────────────────────────────────────────

    event TaskCreated(bytes32 indexed taskId);
    event TaskCancelled(bytes32 indexed taskId);
    event CompoundedViaGelato(uint256 totalRewards, uint256 fee, uint256 compounded);
    event MinIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "GelatoCompounder: not owner");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _vault    Address of the deployed VeMEZOAutoCompounder vault.
     * @param _automate Address of the Gelato Automate contract on this chain.
     */
    constructor(address _vault, address _automate) {
        require(_vault    != address(0), "Invalid vault");
        require(_automate != address(0), "Invalid automate");
        vault    = VeMEZOAutoCompounder(_vault);
        automate = IAutomate(_automate);
        owner    = msg.sender;
    }

    // ── Gelato resolver ──────────────────────────────────────────────────────

    /**
     * @notice Off-chain resolver called by Gelato nodes to decide whether to run.
     * @return canExec     True when compounding is due and profitable.
     * @return execPayload ABI-encoded call to `executeCompound()`.
     */
    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        if (block.timestamp < lastExecution + minInterval) {
            return (false, bytes("Too soon"));
        }
        if (!vault.checkUpkeep(tx.gasprice)) {
            return (false, bytes("Not profitable"));
        }
        execPayload = abi.encodeWithSelector(this.executeCompound.selector);
        return (true, execPayload);
    }

    // ── Execution ────────────────────────────────────────────────────────────

    /**
     * @notice Execute compoundAll on the vault. Called by Gelato executor.
     */
    function executeCompound() external {
        lastExecution = block.timestamp;
        (uint256 rewards, uint256 fee, uint256 compounded) = vault.compoundAll();
        emit CompoundedViaGelato(rewards, fee, compounded);
    }

    // ── Task management ──────────────────────────────────────────────────────

    /**
     * @notice Register a resolver-based automation task with Gelato.
     * @return newTaskId The Gelato task ID.
     */
    function createTask() external onlyOwner returns (bytes32 newTaskId) {
        require(taskId == bytes32(0), "Task already exists");

        IAutomate.ModuleData memory moduleData;
        moduleData.modules = new IAutomate.Module[](2);
        moduleData.args    = new bytes[](2);

        moduleData.modules[0] = IAutomate.Module.RESOLVER;
        moduleData.modules[1] = IAutomate.Module.PROXY;

        moduleData.args[0] = abi.encode(address(this), abi.encodeWithSelector(this.checker.selector));
        moduleData.args[1] = bytes("");

        newTaskId = automate.createTask(
            address(this),
            abi.encodeWithSelector(this.executeCompound.selector),
            moduleData,
            address(0)   // native token fee
        );

        taskId = newTaskId;
        emit TaskCreated(newTaskId);
    }

    /**
     * @notice Cancel the active Gelato task.
     */
    function cancelTask() external onlyOwner {
        require(taskId != bytes32(0), "No task exists");
        automate.cancelTask(taskId);
        emit TaskCancelled(taskId);
        taskId = bytes32(0);
    }

    // ── Config ────────────────────────────────────────────────────────────────

    function setMinInterval(uint256 _interval) external onlyOwner {
        require(_interval >= 1 hours,  "Min 1 hour");
        require(_interval <= 7 days,   "Max 7 days");
        emit MinIntervalUpdated(minInterval, _interval);
        minInterval = _interval;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}
