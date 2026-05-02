/**
 * keeper/src/watcher.ts
 *
 * WebSocket-based event watcher for the VeMEZOAutoCompounder vault.
 *
 * Uses the Mezo WSS RPC endpoint (wss://rpc-ws.test.mezo.org) to subscribe
 * to on-chain events in real time. This complements the cron-based keeper by:
 *
 *   • Providing a live health feed — any missed compound or failed vote shows
 *     up within seconds rather than on the next cron tick.
 *   • Alerting immediately when the keeper's own transactions land on-chain,
 *     confirming success without polling for receipts.
 *   • Detecting unexpected events (e.g. a Paused or KeeperUpdated event) so
 *     the team can react before the next epoch.
 *
 * Environment variables:
 *   MEZO_WSS_URL   – Mezo WebSocket RPC (default: wss://rpc-ws.test.mezo.org)
 *   VAULT_ADDRESS  – Deployed VeMEZOAutoCompounder address
 */

import { ethers } from "ethers";
import winston from "winston";
import "dotenv/config";

const WSS_URL      = process.env.MEZO_WSS_URL  ?? "wss://rpc-ws.test.mezo.org";
const VAULT_ADDR   = process.env.VAULT_ADDRESS  ?? "";

// Minimal ABI covering only the events we watch
const VAULT_ABI = [
  "event Deposited(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 indexed tokenId, uint256 value, uint256 shares)",
  "event Compounded(uint256 totalRewards, uint256 fee, uint256 amountCompounded)",
  "event GaugesVoted(uint256 indexed epochTimestamp, uint256 tokenCount, uint256 gaugeCount)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
  // Multi-keeper events (HIGH severity — any keeper change should trigger immediate review)
  "event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper)",
  "event KeeperAdded(address indexed keeper)",
  "event KeeperRemoved(address indexed keeper)",
  // Pause/unpause
  "event Paused(address account)",
  "event Unpaused(address account)",
  // Security config changes (MEDIUM severity)
  "event MinDepositDurationUpdated(uint256 oldDuration, uint256 newDuration)",
  "event MinCompoundIntervalUpdated(uint256 oldInterval, uint256 newInterval)",
  "event SwapSlippageUpdated(uint256 oldBps, uint256 newBps)",
  "event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee)",
];

// Reconnection config
const RECONNECT_DELAY_MS    = 5_000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Start watching vault events over WebSocket.
 *
 * Automatically reconnects on disconnect with exponential back-off.
 * Passes all events to the provided `log` instance so output appears in the
 * same structured log stream as the rest of the keeper.
 *
 * @param log  Winston logger from the caller.
 */
export async function startWatcher(log: winston.Logger): Promise<void> {
  if (!VAULT_ADDR) {
    log.warn("[watcher] VAULT_ADDRESS not set — event watcher disabled");
    return;
  }

  let attempts = 0;

  async function connect(): Promise<void> {
    try {
      log.info("[watcher] Connecting to WebSocket RPC", { url: WSS_URL });
      const provider = new ethers.WebSocketProvider(WSS_URL);
      const vault    = new ethers.Contract(VAULT_ADDR, VAULT_ABI, provider);
      attempts = 0; // reset on successful connect

      // ── Deposit / Withdraw ──────────────────────────────────────────────
      vault.on("Deposited", (user, tokenId, value, shares) => {
        log.info("[watcher] Deposited", {
          user,
          tokenId: tokenId.toString(),
          value:  ethers.formatEther(value),
          shares: ethers.formatEther(shares),
        });
      });

      vault.on("Withdrawn", (user, tokenId, value, shares) => {
        log.info("[watcher] Withdrawn", {
          user,
          tokenId: tokenId.toString(),
          value:  ethers.formatEther(value),
          shares: ethers.formatEther(shares),
        });
      });

      // ── Compound confirmation ───────────────────────────────────────────
      vault.on("Compounded", (totalRewards, fee, amountCompounded) => {
        log.info("[watcher] Compounded", {
          totalRewards:     ethers.formatEther(totalRewards),
          fee:              ethers.formatEther(fee),
          amountCompounded: ethers.formatEther(amountCompounded),
        });
      });

      // ── Epoch vote confirmation ─────────────────────────────────────────
      vault.on("GaugesVoted", (epochTimestamp, tokenCount, gaugeCount) => {
        log.info("[watcher] GaugesVoted", {
          epochTimestamp: epochTimestamp.toString(),
          tokenCount:     tokenCount.toString(),
          gaugeCount:     gaugeCount.toString(),
        });
      });

      // ── User reward claims ──────────────────────────────────────────────
      vault.on("RewardsClaimed", (user, amount) => {
        log.info("[watcher] RewardsClaimed", {
          user,
          amount: ethers.formatEther(amount),
        });
      });

      // ── Security / admin events ─────────────────────────────────────────
      // [HIGH] Any keeper change requires immediate human review
      vault.on("KeeperUpdated", (oldKeeper, newKeeper) => {
        log.warn("[watcher] HIGH — KeeperUpdated — verify this is expected", { oldKeeper, newKeeper });
      });

      vault.on("KeeperAdded", (keeper) => {
        log.warn("[watcher] HIGH — KeeperAdded — new keeper authorised", { keeper });
      });

      vault.on("KeeperRemoved", (keeper) => {
        log.warn("[watcher] HIGH — KeeperRemoved — keeper deauthorised", { keeper });
      });

      vault.on("Paused", (account) => {
        log.warn("[watcher] HIGH — Vault PAUSED", { account });
      });

      vault.on("Unpaused", (account) => {
        log.info("[watcher] Vault unpaused", { account });
      });

      // [MEDIUM] Security parameter changes — log for audit trail
      vault.on("MinDepositDurationUpdated", (oldDuration, newDuration) => {
        log.warn("[watcher] MEDIUM — MinDepositDurationUpdated", {
          oldDuration: oldDuration.toString(),
          newDuration: newDuration.toString(),
        });
      });

      vault.on("MinCompoundIntervalUpdated", (oldInterval, newInterval) => {
        log.warn("[watcher] MEDIUM — MinCompoundIntervalUpdated", {
          oldInterval: oldInterval.toString(),
          newInterval: newInterval.toString(),
        });
      });

      vault.on("SwapSlippageUpdated", (oldBps, newBps) => {
        log.warn("[watcher] MEDIUM — SwapSlippageUpdated", {
          oldBps: oldBps.toString(),
          newBps: newBps.toString(),
        });
      });

      vault.on("PerformanceFeeUpdated", (oldFee, newFee) => {
        log.warn("[watcher] MEDIUM — PerformanceFeeUpdated", {
          oldFee: oldFee.toString(),
          newFee: newFee.toString(),
        });
      });

      // ── Connection lifecycle ────────────────────────────────────────────
      const ws = (provider as any).websocket;
      if (ws) {
        ws.on("close", () => {
          log.warn("[watcher] WebSocket closed — scheduling reconnect");
          vault.removeAllListeners();
          scheduleReconnect();
        });
        ws.on("error", (err: Error) => {
          log.error("[watcher] WebSocket error", { err: err.message });
        });
      }

      log.info("[watcher] Subscribed to vault events", { vault: VAULT_ADDR });
    } catch (err: any) {
      log.error("[watcher] Connection failed", { err: err.message });
      scheduleReconnect();
    }
  }

  function scheduleReconnect(): void {
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      log.error("[watcher] Max reconnect attempts reached — watcher stopped");
      return;
    }
    const delay = RECONNECT_DELAY_MS * Math.pow(2, attempts);
    log.info("[watcher] Reconnecting", { attempt: ++attempts, delayMs: delay });
    setTimeout(connect, delay);
  }

  await connect();
}
