// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title  IMUSD
 * @notice Interface for the Mezo MUSD stablecoin.
 *
 *         MUSD is Mezo's native BTC-collateralised stablecoin. The vault uses MUSD
 *         as the denomination for performance fee collection, distributing a portion
 *         to vveMEZO holders and optionally auto-staking the remainder into the
 *         MUSD Savings Vault for additional treasury yield.
 */
interface IMUSD is IERC20 {
    /**
     * @notice Mint new MUSD to a recipient (protocol-only).
     * @param  to     Recipient address.
     * @param  amount Amount of MUSD to mint (18-decimal units).
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burn MUSD from an address (protocol-only).
     * @param  from   Address to burn from.
     * @param  amount Amount of MUSD to burn (18-decimal units).
     */
    function burn(address from, uint256 amount) external;

    /**
     * @notice Returns the current BTC/USD price used for collateral valuation.
     * @return price  BTC price in USD (18-decimal units).
     */
    function getBTCPrice() external view returns (uint256 price);

    /// @notice Returns the total BTC collateral backing all outstanding MUSD (18-decimal units).
    function totalCollateral() external view returns (uint256);
}
