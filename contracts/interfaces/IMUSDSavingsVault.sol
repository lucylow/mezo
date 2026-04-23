// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @notice Mezo MUSD savings / ERC-4626 style vault used to auto-stake treasury fees.
 */
interface IMUSDSavingsVault {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    function convertToAssets(uint256 shares) external view returns (uint256);

    function convertToShares(uint256 assets) external view returns (uint256);

    function totalAssets() external view returns (uint256);
}
