/**
 * keeper/src/treasury.ts
 *
 * MUSD Treasury automation module.
 *
 * Responsibilities:
 *   1. Query MUSD balance held by TreasuryYieldManager
 *   2. Trigger deployTreasury() when balance exceeds the configured threshold
 *   3. Report treasury value, APY estimate, and sMUSD share count
 *
 * Environment variables:
 *   MEZO_RPC_URL             – RPC endpoint (default: https://rpc.test.mezo.org)
 *   KEEPER_PRIVATE_KEY       – Signer key
 *   TREASURY_MANAGER_ADDRESS – Deployed TreasuryYieldManager address
 *   MUSD_TOKEN               – MUSD ERC-20 address
 *   MUSD_MIN_DEPLOY_AMOUNT   – Min MUSD before deploying (default: 1000, in whole tokens)
 */

import { ethers } from "ethers";
import "dotenv/config";

const RPC_URL                = process.env.MEZO_RPC_URL                ?? "https://rpc.test.mezo.org";
const TREASURY_MANAGER_ADDR  = process.env.TREASURY_MANAGER_ADDRESS    ?? "";
const MUSD_TOKEN_ADDR        = process.env.MUSD_TOKEN                  ?? "";
const MIN_DEPLOY_WHOLE       = Number(process.env.MUSD_MIN_DEPLOY_AMOUNT ?? "1000");

const TREASURY_MANAGER_ABI = [
  "function deployTreasury(uint256 totalAmount) external",
  "function getTotalValue() view returns (uint256)",
  "function savingsVaultShares() view returns (uint256)",
  "function allocation() view returns (uint256,uint256,uint256,uint256)",
] as const;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
] as const;

export interface TreasuryStatus {
  balance:       bigint;   // idle MUSD on TreasuryYieldManager
  totalValue:    bigint;   // total MUSD value including staked sMUSD
  shares:        bigint;   // sMUSD shares held
  deployed:      boolean;  // whether deployment was triggered this run
  skippedReason: string;   // empty string when deployed
}

/**
 * Main entry point called by the keeper cron.
 *
 * Deploys idle MUSD held by TreasuryYieldManager into the configured
 * yield strategies when balance exceeds the minimum threshold.
 */
export async function runTreasuryDeployment(): Promise<TreasuryStatus> {
  const status: TreasuryStatus = {
    balance: 0n,
    totalValue: 0n,
    shares: 0n,
    deployed: false,
    skippedReason: "",
  };

  if (!TREASURY_MANAGER_ADDR) {
    status.skippedReason = "TREASURY_MANAGER_ADDRESS not set";
    return status;
  }
  if (!MUSD_TOKEN_ADDR) {
    status.skippedReason = "MUSD_TOKEN not set";
    return status;
  }

  const key = process.env.KEEPER_PRIVATE_KEY;
  if (!key) {
    status.skippedReason = "KEEPER_PRIVATE_KEY not set";
    return status;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(key, provider);

  const musd            = new ethers.Contract(MUSD_TOKEN_ADDR, ERC20_ABI, provider);
  const treasuryManager = new ethers.Contract(TREASURY_MANAGER_ADDR, TREASURY_MANAGER_ABI, signer);

  // ── Query current state ──────────────────────────────────────────────────
  const [balance, totalValue, shares] = await Promise.all([
    musd.balanceOf(TREASURY_MANAGER_ADDR) as Promise<bigint>,
    treasuryManager.getTotalValue()       as Promise<bigint>,
    treasuryManager.savingsVaultShares()  as Promise<bigint>,
  ]);

  status.balance    = balance;
  status.totalValue = totalValue;
  status.shares     = shares;

  const minDeploy = ethers.parseUnits(MIN_DEPLOY_WHOLE.toString(), 18);

  if (balance < minDeploy) {
    status.skippedReason = `Balance ${ethers.formatUnits(balance, 18)} MUSD below threshold ${MIN_DEPLOY_WHOLE} MUSD`;
    return status;
  }

  // ── Deploy idle MUSD ─────────────────────────────────────────────────────
  console.log(`[treasury] Deploying ${ethers.formatUnits(balance, 18)} MUSD via TreasuryYieldManager…`);
  const tx = await treasuryManager.deployTreasury(balance);
  const receipt = await tx.wait();
  console.log(`[treasury] Confirmed in block ${receipt?.blockNumber}, hash: ${tx.hash}`);

  status.deployed = true;
  return status;
}

/**
 * Human-readable summary for logging / Discord embeds.
 */
export function formatTreasuryStatus(s: TreasuryStatus): string {
  if (!s.deployed) return `[treasury] Skipped — ${s.skippedReason}`;
  return (
    `[treasury] Deployed ✓\n` +
    `  Idle balance:  ${ethers.formatUnits(s.balance, 18)} MUSD\n` +
    `  Total value:   ${ethers.formatUnits(s.totalValue, 18)} MUSD\n` +
    `  sMUSD shares:  ${ethers.formatUnits(s.shares, 18)}`
  );
}
