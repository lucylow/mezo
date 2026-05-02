/**
 * veMEZO Auto-Compounder – Keeper Bot
 *
 * Runs compound operations on the vault when profitability conditions are met.
 * Can be deployed as:
 *   • A plain Node.js process (cron via node-cron)
 *   • An OpenZeppelin Defender Autotask (see defender-autotask.js)
 *
 * Environment variables (set in .env):
 *   MEZO_RPC_URL                 – Mezo JSON-RPC endpoint
 *   VAULT_ADDRESS                – Deployed VeMEZOAutoCompounder address
 *   KEEPER_PRIVATE_KEY           – EOA private key (keep this safe!)
 *   MAX_GAS_PRICE                – Max gas price in wei (default: 100 gwei)
 *   DISCORD_WEBHOOK_URL          – Optional: success notifications
 *   DISCORD_ALERT_URL            – Optional: error alerts (falls back to DISCORD_WEBHOOK_URL)
 *   KEEPER_VERBOSE_NOTIFICATIONS – Set "true" to also notify on skipped rounds
 *   KEEPER_MARGIN_BPS            – Reward/gasCost safety margin in bps (default: 1100 = 110%)
 */

import { ethers } from "ethers";
import cron from "node-cron";
import winston from "winston";
import "dotenv/config";
import { checkProfitability, formatProfitabilityResult } from "./profitability";
import { notifyCompoundSuccess, notifyError, notifySkipped } from "./discord";
import { runTreasuryDeployment, formatTreasuryStatus } from "./treasury";

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL       = process.env.MEZO_RPC_URL        ?? "https://rpc.test.mezo.org";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS        ?? "";
const KEEPER_KEY    = process.env.KEEPER_PRIVATE_KEY   ?? "";
const MAX_GAS_PRICE = BigInt(process.env.MAX_GAS_PRICE ?? String(100n * 10n ** 9n)); // 100 gwei
const MARGIN_BPS    = BigInt(process.env.KEEPER_MARGIN_BPS ?? "1100");               // 110%

// ── Logger ────────────────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log",    level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// ── Contract ABI (minimal) ────────────────────────────────────────────────────

const VAULT_ABI = [
  "function compoundAll() external returns (uint256 totalRewards, uint256 totalFee, uint256 totalCompounded)",
  "function getPendingRewards()          external view returns (uint256)",
  "function getDepositedTokenCount()     external view returns (uint256)",
  "function performanceFee()             external view returns (uint256)",
  "function voteForGauges()              external",
  "function lastVoteTime()               external view returns (uint256)",
  "function getGaugeVotes()              external view returns (tuple(address gauge, uint256 weight)[])",
  "event Compounded(uint256 totalRewards, uint256 fee, uint256 amountCompounded)",
  "event GaugesVoted(uint256 indexed epochTimestamp, uint256 tokenCount, uint256 gaugeCount)",
];

const vaultIface = new ethers.Interface(VAULT_ABI);

// ── Core logic ────────────────────────────────────────────────────────────────

async function compound(): Promise<void> {
  logger.info("Starting compounding check…");

  if (!VAULT_ADDRESS) { logger.error("VAULT_ADDRESS not set"); return; }
  if (!KEEPER_KEY)    { logger.error("KEEPER_PRIVATE_KEY not set"); return; }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(KEEPER_KEY, provider);
  const vault    = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

  try {
    // ── Profitability check ─────────────────────────────────────────────────
    const prof = await checkProfitability(vault, provider, MAX_GAS_PRICE, MARGIN_BPS);
    logger.info(formatProfitabilityResult(prof));

    if (prof.gasPrice > MAX_GAS_PRICE) {
      const msg = `Gas price ${ethers.formatUnits(prof.gasPrice, "gwei")} gwei exceeds max ${ethers.formatUnits(MAX_GAS_PRICE, "gwei")} gwei`;
      logger.warn(msg);
      await notifySkipped(msg, prof);
      return;
    }

    if (!prof.canCompound) {
      const msg = `Not profitable — pending ${ethers.formatEther(prof.pendingRewards)} MEZO < gas cost ${ethers.formatEther(prof.gasCost)} BTC`;
      logger.info(msg);
      await notifySkipped(msg, prof);
      return;
    }

    // ── Execute ─────────────────────────────────────────────────────────────
    logger.info("Executing compoundAll()…");
    const tx      = await vault.compoundAll({ gasPrice: prof.gasPrice });
    logger.info("Transaction sent", { txHash: tx.hash });

    const receipt = await tx.wait();
    logger.info("Confirmed", { blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() });

    // Parse the Compounded event from the receipt
    let totalRewards    = 0n;
    let fee             = 0n;
    let amountCompounded = 0n;

    for (const log of receipt.logs) {
      try {
        const parsed = vaultIface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === "Compounded") {
          [totalRewards, fee, amountCompounded] = parsed.args as unknown as [bigint, bigint, bigint];
          break;
        }
      } catch { /* not a vault event */ }
    }

    const performanceFeeBps = await vault.performanceFee();
    logger.info("Compound complete", {
      totalRewards:     ethers.formatEther(totalRewards),
      fee:              ethers.formatEther(fee),
      amountCompounded: ethers.formatEther(amountCompounded),
      feePercent:       `${(Number(performanceFeeBps) / 100).toFixed(1)}%`,
    });

    await notifyCompoundSuccess({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      totalRewards,
      fee,
      amountCompounded,
      profitability: prof,
    });

    // Run treasury deployment opportunistically after each compound
    const treasuryStatus = await runTreasuryDeployment(logger).catch(() => null);
    if (treasuryStatus) logger.info(formatTreasuryStatus(treasuryStatus));

  } catch (err: any) {
    logger.error("Compounding failed", { err: err.message });
    await notifyError(err.message, { vault: VAULT_ADDRESS, rpc: RPC_URL });
  }
}

// ── Gauge vote recasting ──────────────────────────────────────────────────────

/**
 * Re-cast gauge votes for all deposited veMEZO NFTs.
 * veMEZO voting power decays and must be recast every epoch (7-day Thursday cycle).
 * Runs slightly after compound so updated balances are reflected in vote weight.
 */
async function recastVotes(): Promise<void> {
  if (!VAULT_ADDRESS || !KEEPER_KEY) return;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(KEEPER_KEY, provider);
  const vault    = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

  try {
    const gaugeVotes = await vault.getGaugeVotes();
    if (gaugeVotes.length === 0) {
      logger.info("No gauge votes configured — skipping vote recast");
      return;
    }

    const tokenCount = await vault.getDepositedTokenCount();
    if (tokenCount === 0n) {
      logger.info("No deposited tokens — skipping vote recast");
      return;
    }

    logger.info("Recasting epoch votes…", { tokenCount: tokenCount.toString(), gaugeCount: gaugeVotes.length });
    const tx = await vault.voteForGauges({ gasPrice: (await provider.getFeeData()).gasPrice });
    const receipt = await tx.wait();
    logger.info("Epoch votes recast", { txHash: tx.hash, blockNumber: receipt.blockNumber });

    await notifyCompoundSuccess({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      totalRewards: 0n,
      fee: 0n,
      amountCompounded: 0n,
      profitability: { canCompound: true, pendingRewards: 0n, estimatedGas: 0n, gasCost: 0n, gasPrice: 0n, tokenCount, netRewards: 0n },
    }).catch(() => {});

  } catch (err: any) {
    logger.warn("Vote recast failed — will retry next epoch", { err: err.message });
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

// Primary: run after epoch ends (Thursdays 00:05 UTC — Mezo epoch rhythm)
// Step 1: compound rewards, Step 2 (2 min later): recast gauge votes
cron.schedule("5 0 * * 4", () => {
  logger.info("Epoch cron triggered — compounding then recasting votes");
  compound().catch((e) => logger.error(e));
});
cron.schedule("7 0 * * 4", () => {
  logger.info("Epoch vote-recast cron triggered");
  recastVotes().catch((e) => logger.error(e));
});

// Backup: every 6 hours in case the epoch cron is missed
cron.schedule("0 */6 * * *", () => {
  logger.info("Hourly backup cron triggered");
  compound().catch((e) => logger.error(e));
});

// ── Boot ──────────────────────────────────────────────────────────────────────

logger.info("Keeper bot started", { rpcUrl: RPC_URL, vaultAddress: VAULT_ADDRESS });
compound().catch((e) => logger.error(e));

process.on("SIGINT",  () => { logger.info("Shutting down (SIGINT)");  process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down (SIGTERM)"); process.exit(0); });
