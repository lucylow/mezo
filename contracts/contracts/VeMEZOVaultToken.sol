// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC4626.sol";

/**
 * @title VeMEZOVaultToken
 * @notice ERC-20 vault share token (vveMEZO) with ERC-4626 compliance
 *         and on-chain governance voting power (ERC-20 Votes / EIP-712).
 *
 * Minted when a user deposits a veMEZO NFT into VeMEZOAutoCompounder and
 * burned when they withdraw.  Share price increases each time the keeper
 * compounds rewards because `_totalAssets` grows while supply stays fixed.
 *
 * Voting power is self-delegated on mint (unless the holder explicitly
 * delegates to another address).  This makes vveMEZO immediately usable
 * as the voting token for VaultGovernor without a separate delegation step.
 *
 * ERC-4626 deposit/withdraw entry points revert with a helpful message —
 * all actual minting/burning must go through the vault contract, which
 * enforces the NFT ownership check.
 */
contract VeMEZOVaultToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable2Step, ReentrancyGuard, IERC4626 {

    // ── Immutables ────────────────────────────────────────────────────────────
    /// @notice The VeMEZOAutoCompounder vault that controls this token.
    address public immutable vault;

    /// @inheritdoc IERC4626
    address public immutable override asset;

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _totalAssets;

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyVault() {
        require(msg.sender == vault, "VeMEZOVaultToken: caller is not vault");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        address _vault,
        address _asset
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
        Ownable(msg.sender)
    {
        require(_vault != address(0), "Invalid vault address");
        require(_asset != address(0), "Invalid asset address");
        vault = _vault;
        asset = _asset;
    }

    // ── ERC-4626: view ────────────────────────────────────────────────────────

    /// @inheritdoc IERC4626
    function totalAssets() public view override returns (uint256) {
        return _totalAssets;
    }

    /// @inheritdoc IERC4626
    function convertToShares(uint256 assets) public view override returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / _totalAssets;
    }

    /// @inheritdoc IERC4626
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : (shares * _totalAssets) / supply;
    }

    /// @inheritdoc IERC4626
    function maxDeposit(address) public pure override returns (uint256) { return type(uint256).max; }

    /// @inheritdoc IERC4626
    function maxMint(address) public pure override returns (uint256) { return type(uint256).max; }

    /// @inheritdoc IERC4626
    function maxWithdraw(address owner) public view override returns (uint256) {
        return convertToAssets(balanceOf(owner));
    }

    /// @inheritdoc IERC4626
    function maxRedeem(address owner) public view override returns (uint256) {
        return balanceOf(owner);
    }

    /// @inheritdoc IERC4626
    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }

    /// @inheritdoc IERC4626
    function previewMint(uint256 shares) public view override returns (uint256) {
        return convertToAssets(shares);
    }

    /// @inheritdoc IERC4626
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }

    /// @inheritdoc IERC4626
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return convertToAssets(shares);
    }

    // ── ERC-4626: mutative (vault-only wrappers) ──────────────────────────────

    /**
     * @dev Mint vault shares for `to` when `assets` worth of underlying is deposited.
     *      Called exclusively by VeMEZOAutoCompounder.
     *      Auto-delegates voting power to the recipient if they have not yet delegated.
     */
    function mintShares(address to, uint256 assets) external onlyVault nonReentrant returns (uint256 shares) {
        shares = convertToShares(assets);
        require(shares > 0, "VeMEZOVaultToken: zero shares");
        _mint(to, shares);
        _totalAssets += assets;

        // Auto-delegate to self on first mint so voting power is active immediately.
        if (delegates(to) == address(0)) {
            _delegate(to, to);
        }

        emit Deposit(msg.sender, to, assets, shares);
    }

    /**
     * @dev Burn `shares` from `from` and return the equivalent asset amount.
     *      Called exclusively by VeMEZOAutoCompounder.
     */
    function burnShares(address from, uint256 shares) external onlyVault nonReentrant returns (uint256 assets) {
        assets = convertToAssets(shares);
        require(assets > 0, "VeMEZOVaultToken: zero assets");
        require(assets <= _totalAssets, "VeMEZOVaultToken: insufficient assets");
        _burn(from, shares);
        _totalAssets -= assets;
        emit Withdraw(msg.sender, from, from, assets, shares);
    }

    /**
     * @dev Update total assets after a compound run.
     *      Called exclusively by VeMEZOAutoCompounder.
     */
    function updateTotalAssets(uint256 newTotalAssets) external onlyVault {
        _totalAssets = newTotalAssets;
    }

    // ── ERC-4626: standard entry points (intentionally disabled) ─────────────

    /// @inheritdoc IERC4626
    function deposit(uint256, address) external pure override returns (uint256) {
        revert("Use vault.deposit(tokenId)");
    }

    /// @inheritdoc IERC4626
    function mint(uint256, address) external pure override returns (uint256) {
        revert("Use vault.deposit(tokenId)");
    }

    /// @inheritdoc IERC4626
    function withdraw(uint256, address, address) external pure override returns (uint256) {
        revert("Use vault.withdraw(tokenId)");
    }

    /// @inheritdoc IERC4626
    function redeem(uint256, address, address) external pure override returns (uint256) {
        revert("Use vault.withdraw(tokenId)");
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /// @notice Emergency override of total assets (owner-only, for recovery).
    function emergencyUpdateTotalAssets(uint256 newTotalAssets) external onlyOwner {
        _totalAssets = newTotalAssets;
    }

    // ── Required overrides (ERC20 + ERC20Votes) ───────────────────────────────

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
