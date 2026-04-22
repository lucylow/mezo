/**
 * veMEZO Auto-Compounder – Keeper Bot
 *
 * Runs compound operations on the vault when profitability conditions are met.
 * Can be deployed as:
 *   • A plain Node.js process (cron via node-cron)
 *   • An OpenZeppelin Defender Autotask (see defender-autotask.js)
 *
 * Environment variables (set in .env):
 *   MEZO_RPC_URL         – Mezo JSON-RPC endpoint
 *   VAULT_ADDRESS        – Deployed VeMEZOAutoCompounder address
 *   KEEPER_PRIVATE_KEY   – EOA private key (keep this safe!)
 *   MAX_GAS_PRICE        – Max gas price in wei (default: 100 gwei)
 *   DISCORD_WEBHOOK_URL  – Optional: success notifications
 *   DISCORD_ALERT_URL    – Optional: error alerts
 */

import { ethers } from "ethers";
import cron from "node-cron";
import winston from "winston";
import "dotenv/config";

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL         = process.env.MEZO_RPC_URL        ?? "https://rpc.test.mezo.org";
const VAULT_ADDRESS   = process.env.VAULT_ADDRESS        ?? "";
const KEEPER_KEY      = process.env.KEEPER_PRIVATE_KEY   ?? "";
const MAX_GAS_PRICE   = BigInt(process.env.MAX_GAS_PRICE ?? String(100n * 10n ** 9n)); // 100 gwei

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
  "function checkUpkeep(uint256 gasPrice) external view returns (bool canCompound)",
  "function getPendingRewards() external view returns (uint256)",
  "function getDepositedTokenCount() external view returns (uint256)",
  "event Compounded(uint256 totalRewards, uint256 fee, uint256 amountCompounded)",
];

// ── Core logic ────────────────────────────────────────────────────────────────

async function compound(): Promise<void> {
  logger.info("Starting compounding check...");

  if (!VAULT_ADDRESS) { logger.error("VAULT_ADDRESS not set"); return; }
  if (!KEEPER_KEY)    { logger.error("KEEPER_PRIVATE_KEY not set"); return; }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(KEEPER_KEY, provider);
  const vault    = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

  try {
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");

    if (gasPrice > MAX_GAS_PRICE) {
      logger.warn({ gasPrice: gasPrice.toString() }, "Gas price too high – skipping");
      return;
    }

    const canCompound = await vault.checkUpkeep(gasPrice);
    if (!canCompound) {
      const pending    = await vault.getPendingRewards();
      const tokenCount = await vault.getDepositedTokenCount();
      logger.info(
        { pending: ethers.formatEther(pending), tokenCount: tokenCount.toString() },
        "Not profitable – skipping",
      );
      return;
    }

    logger.info("Executing compoundAll()…");
    const tx      = await vault.compoundAll({ gasPrice });
    logger.info({ txHash: tx.hash }, "Transaction sent");

    const receipt = await tx.wait();
    logger.info({ blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() }, "Confirmed");

    const event = receipt.logs.find((l: any) => l.fragment?.name === "Compounded");
    if (event) {
      const [totalRewards, fee, amountCompounded] = event.args;
      logger.info(
        {
          totalRewards:     ethers.formatEther(totalRewards),
          fee:              ethers.formatEther(fee),
          amountCompounded: ethers.formatEther(amountCompounded),
        },
        "Compound event",
      );
    }

    await notify(
      `✅ **veMEZO Compounded**\nTx: \`${tx.hash}\`\nBlock: ${receipt.blockNumber}`,
    );
  } catch (err: any) {
    logger.error({ err: err.message }, "Compounding failed");
    await notify(`🚨 **Keeper Alert**\n${err.message}`, true);
  }
}

// ── Discord notifications ─────────────────────────────────────────────────────

async function notify(content: string, isAlert = false): Promise<void> {
  const url = isAlert
    ? (process.env.DISCORD_ALERT_URL ?? process.env.DISCORD_WEBHOOK_URL)
    : process.env.DISCORD_WEBHOOK_URL;

  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    logger.warn("Discord notification failed");
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

// Primary: run after epoch ends (Thursdays 00:05 UTC — Mezo epoch rhythm)
cron.schedule("5 0 * * 4", () => {
  logger.info("Epoch cron triggered");
  compound().catch((e) => logger.error(e));
});

// Backup: every 6 hours in case the epoch cron is missed
cron.schedule("0 */6 * * *", () => {
  logger.info("Hourly backup cron triggered");
  compound().catch((e) => logger.error(e));
});

// ── Boot ──────────────────────────────────────────────────────────────────────

logger.info({ rpcUrl: RPC_URL, vaultAddress: VAULT_ADDRESS }, "Keeper bot started");
compound().catch((e) => logger.error(e));

process.on("SIGINT",  () => { logger.info("Shutting down (SIGINT)");  process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down (SIGTERM)"); process.exit(0); });
