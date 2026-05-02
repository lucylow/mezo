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
 * @title  VeMEZOVaultToken
 * @notice ERC-20 vault share token (vveMEZO) with ERC-4626 compliance and
 *         on-chain governance voting power (ERC-20 Votes / EIP-712).
 *
 *         Minted when a user deposits a veMEZO NFT into VeMEZOAutoCompounder,
 *         and burned when they withdraw. The share price increases each time the
 *         keeper compounds rewards because `_totalAssets` grows while the supply
 *         remains constant.
 *
 *         Voting power is self-delegated on first mint so vveMEZO is immediately
 *         usable as the governance token for VaultGovernor without a separate
 *         delegation step.
 *
 * @dev    ERC-4626 deposit/withdraw/mint/redeem entry points intentionally revert
 *         — all share minting and burning must flow through VeMEZOAutoCompounder,
 *         which enforces NFT ownership checks.
 */
contract VeMEZOVaultToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable2Step, ReentrancyGuard, IERC4626 {

    // ── Custom errors ────────────────────────────────────────────────────────

    error NotVault(address caller);
    error ZeroShares();
    error ZeroAssets();
    error InsufficientAssets(uint256 requested, uint256 available);
    error InvalidAddress();
    error UseVaultDeposit();
    error UseVaultWithdraw();

    // ── Immutables ────────────────────────────────────────────────────────────

    /// @notice The VeMEZOAutoCompounder vault — the only address allowed to mint or burn shares.
    address public immutable vault;

    /// @inheritdoc IERC4626
    address public immutable override asset;

    // ── State ─────────────────────────────────────────────────────────────────

    /// @dev Tracks the total underlying asset value (veMEZO voting power) represented by all shares.
    uint256 private _totalAssets;

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault(msg.sender);
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _name   Token name (e.g. "Vault veMEZO Share").
     * @param _symbol Token symbol (e.g. "vveMEZO").
     * @param _vault  Address of the VeMEZOAutoCompounder vault (immutable after deploy).
     * @param _asset  Address of the MEZO ERC-20 token (used as the ERC-4626 asset).
     */
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
        if (_vault == address(0)) revert InvalidAddress();
        if (_asset == address(0)) revert InvalidAddress();
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
     * @notice Mint vault shares for `to` proportional to the deposited `assets`.
     * @dev    Only callable by the VeMEZOAutoCompounder vault contract.
     *         Auto-delegates voting power to the recipient on first mint so
     *         governance participation is active immediately.
     * @param  to     Recipient of the new shares.
     * @param  assets Underlying asset units (veMEZO voting power) being deposited.
     * @return shares Number of vveMEZO shares minted.
     */
    function mintShares(address to, uint256 assets)
        external
        onlyVault
        nonReentrant
        returns (uint256 shares)
    {
        shares = convertToShares(assets);
        if (shares == 0) revert ZeroShares();

        _mint(to, shares);
        _totalAssets += assets;

        // Auto-delegate to self on first mint so voting power is active immediately.
        if (delegates(to) == address(0)) {
            _delegate(to, to);
        }

        emit Deposit(msg.sender, to, assets, shares);
    }

    /**
     * @notice Burn `shares` from `from` and return the equivalent asset amount.
     * @dev    Only callable by the VeMEZOAutoCompounder vault contract.
     * @param  from   Address whose shares are burned.
     * @param  shares Amount of vveMEZO to burn.
     * @return assets Equivalent underlying asset units returned.
     */
    function burnShares(address from, uint256 shares)
        external
        onlyVault
        nonReentrant
        returns (uint256 assets)
    {
        assets = convertToAssets(shares);
        if (assets == 0) revert ZeroAssets();
        if (assets > _totalAssets) revert InsufficientAssets(assets, _totalAssets);

        _burn(from, shares);
        _totalAssets -= assets;

        emit Withdraw(msg.sender, from, from, assets, shares);
    }

    /**
     * @notice Update the total underlying asset value after a compound run.
     * @dev    Only callable by the VeMEZOAutoCompounder vault contract.
     * @param  newTotalAssets  New total (in veMEZO voting-power units).
     */
    function updateTotalAssets(uint256 newTotalAssets) external onlyVault {
        _totalAssets = newTotalAssets;
    }

    // ── ERC-4626: standard entry points (intentionally disabled) ─────────────

    /// @dev Reverts — share minting is gated on NFT ownership in the vault contract.
    function deposit(uint256, address) external pure override returns (uint256) {
        revert UseVaultDeposit();
    }

    /// @dev Reverts — share minting is gated on NFT ownership in the vault contract.
    function mint(uint256, address) external pure override returns (uint256) {
        revert UseVaultDeposit();
    }

    /// @dev Reverts — share redemption must go through the vault to return the NFT.
    function withdraw(uint256, address, address) external pure override returns (uint256) {
        revert UseVaultWithdraw();
    }

    /// @dev Reverts — share redemption must go through the vault to return the NFT.
    function redeem(uint256, address, address) external pure override returns (uint256) {
        revert UseVaultWithdraw();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * @notice Emergency override of the total assets value (owner-only).
     * @dev    Use only for recovery scenarios where `_totalAssets` has drifted
     *         from the true on-chain value.
     * @param  newTotalAssets  Corrected total asset value.
     */
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
