import { ethers } from "ethers";

/**
 * Profitability module for the veMEZO keeper bot.
 *
 * Computes whether a compounding call is economically worthwhile given
 * the current gas price, pending rewards, and a configurable safety margin.
 */

/** Gas units consumed per NFT token during compoundAll (conservative estimate). */
const GAS_PER_TOKEN = 200_000n;

/** Fixed overhead for the compoundAll call itself (loop setup, storage writes). */
const GAS_OVERHEAD  = 300_000n;

/** Default safety margin: rewards must be 10% above estimated gas cost. */
const DEFAULT_MARGIN_BPS = 1100n; // 110% → pending > gasCost * 1.1

export interface ProfitabilityCheck {
  canCompound:     boolean;
  pendingRewards:  bigint;
  estimatedGas:    bigint;
  gasCost:         bigint;
  gasPrice:        bigint;
  tokenCount:      bigint;
  netRewards:      bigint;
}

const VAULT_ABI = [
  "function getPendingRewards()          external view returns (uint256)",
  "function getDepositedTokenCount()     external view returns (uint256)",
  "function checkUpkeep(uint256 gasPrice) external view returns (bool)",
];

/**
 * Evaluate whether it is profitable to call compoundAll() right now.
 *
 * @param vault      ethers Contract instance connected to VeMEZOAutoCompounder
 * @param provider   read-only JsonRpcProvider (for gas price)
 * @param maxGasWei  maximum gas price threshold in wei (skip if exceeded)
 * @param marginBps  minimum reward-to-gasCost ratio in basis points (default 1100 = 110%)
 */
export async function checkProfitability(
  vault:      ethers.Contract,
  provider:   ethers.JsonRpcProvider,
  maxGasWei:  bigint,
  marginBps   = DEFAULT_MARGIN_BPS,
): Promise<ProfitabilityCheck> {
  const feeData  = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");

  const pendingRewards: bigint = await vault.getPendingRewards();
  const tokenCount:     bigint = await vault.getDepositedTokenCount();

  const estimatedGas = GAS_OVERHEAD + GAS_PER_TOKEN * tokenCount;
  const gasCost      = gasPrice * estimatedGas;

  const canCompound =
    gasPrice <= maxGasWei &&
    pendingRewards > 0n   &&
    pendingRewards * 10_000n >= gasCost * marginBps;

  const netRewards = pendingRewards > gasCost ? pendingRewards - gasCost : 0n;

  return {
    canCompound,
    pendingRewards,
    estimatedGas,
    gasCost,
    gasPrice,
    tokenCount,
    netRewards,
  };
}

/**
 * Human-readable summary of a profitability check for logging.
 */
export function formatProfitabilityResult(result: ProfitabilityCheck): string {
  return [
    `canCompound=${result.canCompound}`,
    `pending=${ethers.formatEther(result.pendingRewards)} MEZO`,
    `gasCost=${ethers.formatEther(result.gasCost)} BTC`,
    `net=${ethers.formatEther(result.netRewards)} MEZO`,
    `tokens=${result.tokenCount}`,
    `gasPrice=${ethers.formatUnits(result.gasPrice, "gwei")} gwei`,
  ].join("  |  ");
}
