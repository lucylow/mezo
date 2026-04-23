// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "../VeMEZOAutoCompounder.sol";

/**
 * @title ChainlinkCompounder
 * @notice Chainlink Automation (Keepers v2) integration for the Auto-Compounder vault.
 *
 * Chainlink nodes call `checkUpkeep()` off-chain; when `upkeepNeeded` is true,
 * they call `performUpkeep()` on-chain via a registered Chainlink upkeep.
 *
 * Deployment steps
 * ────────────────
 * 1. Deploy this contract.
 * 2. Register an upkeep at automation.chain.link pointing to this contract.
 * 3. Fund the upkeep with LINK tokens.
 * 4. Call `vault.updateKeeper(address(this))` to authorise this contract.
 */
contract ChainlinkCompounder {

    // ── State ───────────────────────────────────────────────────────────────

    VeMEZOAutoCompounder public immutable vault;

    /// @notice Minimum interval between compounds.
    uint256 public immutable interval;

    uint256 public lastExecution;

    address public owner;

    // ── Events ──────────────────────────────────────────────────────────────

    event CompoundedViaChainlink(uint256 totalRewards, uint256 fee, uint256 compounded);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ChainlinkCompounder: not owner");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _vault    Address of the deployed VeMEZOAutoCompounder vault.
     * @param _interval Minimum seconds between compounds (e.g. 21600 for 6 hours).
     */
    constructor(address _vault, uint256 _interval) {
        require(_vault    != address(0), "Invalid vault");
        require(_interval >= 1 hours,    "Interval too short");
        vault    = VeMEZOAutoCompounder(_vault);
        interval = _interval;
        owner    = msg.sender;
    }

    // ── Chainlink interface ───────────────────────────────────────────────────

    /**
     * @notice Called by Chainlink nodes to determine whether upkeep is needed.
     * @return upkeepNeeded True when it is time to compound and it is profitable.
     * @return performData  Encoded gas price passed to performUpkeep (informational).
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
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
     */
    function performUpkeep(bytes calldata /* performData */) external {
        require(block.timestamp >= lastExecution + interval, "Too soon");
        lastExecution = block.timestamp;
        (uint256 rewards, uint256 fee, uint256 compounded) = vault.compoundAll();
        emit CompoundedViaChainlink(rewards, fee, compounded);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
