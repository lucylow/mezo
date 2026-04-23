// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title IERC4626
 * @dev Interface for the ERC-4626 Tokenized Vault Standard.
 * https://eips.ethereum.org/EIPS/eip-4626
 */
interface IERC4626 is IERC20, IERC20Metadata {
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    /// @dev Returns the address of the underlying token used for the Vault.
    function asset() external view returns (address assetTokenAddress);

    /// @dev Returns the total amount of the underlying asset managed by the Vault.
    function totalAssets() external view returns (uint256 totalManagedAssets);

    /// @dev Converts assets to shares.
    function convertToShares(uint256 assets) external view returns (uint256 shares);

    /// @dev Converts shares to assets.
    function convertToAssets(uint256 shares) external view returns (uint256 assets);

    /// @dev Returns the maximum amount of assets that can be deposited.
    function maxDeposit(address receiver) external view returns (uint256 maxAssets);

    /// @dev Returns the maximum amount of shares that can be minted.
    function maxMint(address receiver) external view returns (uint256 maxShares);

    /// @dev Returns the maximum amount of assets that can be withdrawn.
    function maxWithdraw(address owner) external view returns (uint256 maxAssets);

    /// @dev Returns the maximum amount of shares that can be redeemed.
    function maxRedeem(address owner) external view returns (uint256 maxShares);

    /// @dev Simulates the effects of a deposit at the current block.
    function previewDeposit(uint256 assets) external view returns (uint256 shares);

    /// @dev Simulates the assets needed to mint `shares`.
    function previewMint(uint256 shares) external view returns (uint256 assets);

    /// @dev Simulates the shares needed to withdraw `assets`.
    function previewWithdraw(uint256 assets) external view returns (uint256 shares);

    /// @dev Simulates the assets received for redeeming `shares`.
    function previewRedeem(uint256 shares) external view returns (uint256 assets);

    /// @dev Deposits assets and mints shares to receiver.
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /// @dev Mints shares and deposits assets to receiver.
    function mint(uint256 shares, address receiver) external returns (uint256 assets);

    /// @dev Withdraws assets and burns shares from owner.
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);

    /// @dev Redeems shares and withdraws assets to receiver.
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}
