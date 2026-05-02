// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title  IMUSDSavingsVault
 * @notice ERC-4626-style interface for the Mezo MUSD Savings Vault.
 *
 *         When `autoStakeMUSD` is enabled in VeMEZOAutoCompounder, the treasury
 *         portion of collected fees is deposited here instead of being sent as raw
 *         MUSD. This earns additional yield on protocol fees, demonstrating deep
 *         integration with Mezo's full financial stack.
 */
interface IMUSDSavingsVault {
    /**
     * @notice Deposit MUSD into the savings vault and receive sMUSD shares.
     * @param  assets    Amount of MUSD to deposit (18-decimal units).
     * @param  receiver  Address that receives the minted sMUSD shares.
     * @return shares    Amount of sMUSD shares minted to `receiver`.
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /**
     * @notice Redeem sMUSD shares for the underlying MUSD.
     * @param  shares    Amount of sMUSD shares to redeem.
     * @param  receiver  Address that receives the withdrawn MUSD.
     * @param  owner     Address whose shares are burned.
     * @return assets    Amount of MUSD returned to `receiver`.
     */
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    /**
     * @notice Returns the MUSD value of a given number of sMUSD shares.
     * @param  shares  Amount of sMUSD shares.
     * @return         Equivalent MUSD value (18-decimal units).
     */
    function convertToAssets(uint256 shares) external view returns (uint256);

    /**
     * @notice Returns the sMUSD shares equivalent to a given MUSD amount.
     * @param  assets  MUSD amount (18-decimal units).
     * @return         Equivalent sMUSD shares.
     */
    function convertToShares(uint256 assets) external view returns (uint256);

    /// @notice Total MUSD assets managed by the savings vault (18-decimal units).
    function totalAssets() external view returns (uint256);
}
