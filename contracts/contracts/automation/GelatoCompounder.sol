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
 * @title  GelatoCompounder
 * @notice Gelato-compatible resolver + executor for decentralized compounding.
 *
 *         Replaces the single centralised keeper bot with a decentralised executor
 *         network. Gelato nodes call `checker()` off-chain; when it returns
 *         canExec=true they submit `executeCompound()` on-chain.
 *
 * @dev    Deployment steps
 *         ─────────────────
 *         1. Deploy this contract.
 *         2. Fund it with a small native balance (BTC on Mezo) for Gelato fees.
 *         3. Call `createTask()` — Gelato registers the resolver-based task.
 *         4. Call `vault.updateKeeper(address(this))` to authorise this contract.
 */
contract GelatoCompounder {

    // ── Custom errors ────────────────────────────────────────────────────────

    error NotOwner(address caller);
    error InvalidAddress();
    error TooSoon(uint256 nextAllowed, uint256 current);
    error TaskAlreadyExists(bytes32 taskId);
    error NoTaskExists();
    error IntervalTooShort(uint256 provided, uint256 minimum);
    error IntervalTooLong(uint256 provided, uint256 maximum);

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice The VeMEZOAutoCompounder vault this contract compounds.
    VeMEZOAutoCompounder public immutable vault;

    /// @notice Gelato Automate contract on this chain.
    IAutomate             public immutable automate;

    /// @notice Gelato task identifier (set after createTask()).
    bytes32 public taskId;

    /// @notice Minimum seconds between compounds (default 6 hours).
    uint256 public minInterval = 6 hours;

    /// @notice Unix timestamp of the last executeCompound() call.
    uint256 public lastExecution;

    /// @notice Owner of this compounder contract.
    address public owner;

    // ── Events ───────────────────────────────────────────────────────────────

    event TaskCreated(bytes32 indexed taskId);
    event TaskCancelled(bytes32 indexed taskId);
    event CompoundedViaGelato(uint256 totalRewards, uint256 fee, uint256 compounded);
    event MinIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _vault    Address of the deployed VeMEZOAutoCompounder vault.
     * @param _automate Address of the Gelato Automate contract on this chain.
     */
    constructor(address _vault, address _automate) {
        if (_vault    == address(0)) revert InvalidAddress();
        if (_automate == address(0)) revert InvalidAddress();
        vault    = VeMEZOAutoCompounder(_vault);
        automate = IAutomate(_automate);
        owner    = msg.sender;
    }

    // ── Gelato resolver ──────────────────────────────────────────────────────

    /**
     * @notice Off-chain resolver called by Gelato nodes to decide whether to execute.
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
     * @notice Execute compoundAll on the vault. Called by the Gelato executor.
     * @dev    Enforces the minimum interval to prevent excessive execution.
     */
    function executeCompound() external {
        if (block.timestamp < lastExecution + minInterval) {
            revert TooSoon(lastExecution + minInterval, block.timestamp);
        }
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
        if (taskId != bytes32(0)) revert TaskAlreadyExists(taskId);

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
        if (taskId == bytes32(0)) revert NoTaskExists();
        automate.cancelTask(taskId);
        emit TaskCancelled(taskId);
        taskId = bytes32(0);
    }

    // ── Config ───────────────────────────────────────────────────────────────

    /**
     * @notice Update the minimum interval between compounds.
     * @param _interval New minimum in seconds (1 hour – 7 days).
     */
    function setMinInterval(uint256 _interval) external onlyOwner {
        if (_interval < 1 hours) revert IntervalTooShort(_interval, 1 hours);
        if (_interval > 7 days)  revert IntervalTooLong(_interval, 7 days);
        emit MinIntervalUpdated(minInterval, _interval);
        minInterval = _interval;
    }

    /**
     * @notice Transfer ownership of this compounder.
     * @param newOwner Must be non-zero.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}
