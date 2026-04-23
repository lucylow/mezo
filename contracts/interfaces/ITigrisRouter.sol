// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @notice Minimal DEX router surface (Uniswap V2–style) for MEZO → MUSD swaps.
 */
interface ITigrisRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}
