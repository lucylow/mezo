import { Router } from "express";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import { mockKeeperStatus } from "../lib/subgraph/mock";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/keeper/status
 * Returns the keeper bot's last run time, next expected run, pending rewards,
 * and whether compounding is currently profitable.
 */
router.get("/keeper/status", async (req, res) => {
  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: mockKeeperStatus(), source: "mock" });
    }

    const query = `
      query KeeperStatus {
        vault(id: "vemezo-auto-compounder") {
          lastCompoundTime
          totalDeposits
        }
        compounds(first: 1, orderBy: timestamp, orderDirection: desc) {
          transactionHash
          blockNumber
          timestamp
          totalRewards
        }
      }
    `;

    const raw = await subgraphRequest<any>(query);
    const lastCompound = raw.compounds?.[0];
    const DAY = 86400;
    const now = Math.floor(Date.now() / 1000);

    return res.json({
      data: {
        lastRun: lastCompound?.timestamp ?? "0",
        nextRun: lastCompound ? String(Number(lastCompound.timestamp) + 7 * DAY) : "0",
        pendingRewards: "0",
        depositedTokenCount: raw.vault?.totalDeposits ?? 0,
        canCompound: false,
        lastTxHash: lastCompound?.transactionHash ?? null,
        lastBlockNumber: lastCompound ? Number(lastCompound.blockNumber) : 0,
        network: process.env.MEZO_CHAIN_ID === "31612" ? "mezo-mainnet" : "mezo-testnet",
        chainId: Number(process.env.MEZO_CHAIN_ID ?? 31611),
      },
      source: "subgraph",
    });
  } catch (err: any) {
    logger.error({ err }, "keeper/status error");
    return res.status(500).json({ error: err.message });
  }
});

export default router;
