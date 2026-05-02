// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "../VeMEZOAutoCompounder.sol";

/**
 * @title  ChainlinkCompounder
 * @notice Chainlink Automation (Keepers v2) integration for the Auto-Compounder vault.
 *
 *         Chainlink nodes call `checkUpkeep()` off-chain; when `upkeepNeeded` is
 *         true, they call `performUpkeep()` on-chain via a registered upkeep.
 *
 * @dev    Deployment steps
 *         ─────────────────
 *         1. Deploy this contract.
 *         2. Register an upkeep at automation.chain.link pointing to this address.
 *         3. Fund the upkeep with LINK tokens.
 *         4. Call `vault.updateKeeper(address(this))` to authorise this contract.
 */
contract ChainlinkCompounder {

    // ── Custom errors ────────────────────────────────────────────────────────

    error NotOwner(address caller);
    error InvalidAddress();
    error IntervalTooShort(uint256 provided, uint256 minimum);
    error TooSoon(uint256 nextAllowed, uint256 current);

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice The VeMEZOAutoCompounder vault this contract compounds.
    VeMEZOAutoCompounder public immutable vault;

    /// @notice Minimum interval between compounds (immutable after deploy).
    uint256 public immutable interval;

    /// @notice Unix timestamp of the last performUpkeep() call.
    uint256 public lastExecution;

    /// @notice Owner of this compounder contract.
    address public owner;

    // ── Events ───────────────────────────────────────────────────────────────

    event CompoundedViaChainlink(uint256 totalRewards, uint256 fee, uint256 compounded);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _vault    Address of the deployed VeMEZOAutoCompounder vault.
     * @param _interval Minimum seconds between compounds (e.g. 21600 for 6 hours).
     */
    constructor(address _vault, uint256 _interval) {
        if (_vault == address(0)) revert InvalidAddress();
        if (_interval < 1 hours) revert IntervalTooShort(_interval, 1 hours);
        vault    = VeMEZOAutoCompounder(_vault);
        interval = _interval;
        owner    = msg.sender;
    }

    // ── Chainlink Automation interface ────────────────────────────────────────

    /**
     * @notice Called by Chainlink nodes to determine whether upkeep is needed.
     * @return upkeepNeeded True when the interval has elapsed and compounding is profitable.
     * @return performData  ABI-encoded gas price passed to performUpkeep (informational).
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (block.timestamp < lastExecution + interval) {
            return (false, bytes(""));
        }
        uint256 gasPrice = tx.gasprice;
        if (!vault.checkUpkeep(gasPrice)) {
            return (false, bytes(""));
        }
        performData  = abi.encode(gasPrice);
        upkeepNeeded = true;
    }

    /**
     * @notice Called by Chainlink nodes when `checkUpkeep` returns true.
     * @dev    Re-checks the interval on-chain to guard against race conditions.
     */
    function performUpkeep(bytes calldata /* performData */) external {
        if (block.timestamp < lastExecution + interval) {
            revert TooSoon(lastExecution + interval, block.timestamp);
        }
        lastExecution = block.timestamp;
        (uint256 rewards, uint256 fee, uint256 compounded) = vault.compoundAll();
        emit CompoundedViaChainlink(rewards, fee, compounded);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * @notice Transfer ownership of this compounder.
     * @param newOwner Must be non-zero.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
