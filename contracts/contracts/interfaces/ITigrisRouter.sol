// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title  ITigrisRouter
 * @notice Minimal Uniswap V2-style DEX router interface used to swap MEZO
 *         performance fees into MUSD on Mezo chain.
 *
 *         The vault calls `getAmountsOut` to compute a 1%-slippage minimum output,
 *         then executes `swapExactTokensForTokens` to convert MEZO → MUSD before
 *         distributing fees to the holder pool and treasury.
 */
interface ITigrisRouter {
    /**
     * @notice Swap an exact amount of input tokens for as many output tokens as possible.
     * @param  amountIn      Exact amount of input token to swap (18-decimal units).
     * @param  amountOutMin  Minimum acceptable output amount — reverts if not met.
     * @param  path          Ordered array of token addresses defining the swap route.
     * @param  to            Recipient of the output tokens.
     * @param  deadline      Unix timestamp after which the transaction will revert.
     * @return amounts       Array of token amounts at each step of the swap path.
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @notice Compute the output amounts for a given input through a swap path.
     * @dev    Used to calculate the `amountOutMin` slippage guard before swapping.
     * @param  amountIn  Input token amount (18-decimal units).
     * @param  path      Ordered array of token addresses defining the swap route.
     * @return amounts   Expected token amounts at each step of the swap path.
     */
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}
