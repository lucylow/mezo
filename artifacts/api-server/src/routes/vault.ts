import { Router } from "express";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import {
  mockVaultStats,
  mockHistoricalMetrics,
  mockRecentActivity,
} from "../lib/subgraph/mock";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/vault/stats
 * Returns aggregated vault metrics plus last 7 days of daily data.
 * Falls back to mock data when subgraph is not configured.
 */
router.get("/vault/stats", async (req, res) => {
  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: mockVaultStats(), source: "mock" });
    }

    const query = `
      query VaultStats {
        vault(id: "vemezo-auto-compounder") {
          id
          totalUnderlying
          totalShares
          performanceFee
          lastCompoundTime
          totalDeposits
          totalCompounded
          totalFeesCollected
          createdAt
          updatedAt
        }
        dailyMetrics(first: 7, orderBy: date, orderDirection: desc) {
          date
          tvl
          dailyRewards
          dailyFees
          totalUsers
        }
      }
    `;

    const data = await subgraphRequest(query);
    return res.json({ data, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err }, "vault/stats error");
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vault/history?days=30
 * Returns daily TVL + rewards history for charting.
 */
router.get("/vault/history", async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);

  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: mockHistoricalMetrics(days), source: "mock" });
    }

    const query = `
      query HistoricalMetrics($first: Int!) {
        dailyMetrics(first: $first, orderBy: date, orderDirection: desc) {
          date
          tvl
          totalShares
          totalUsers
          dailyRewards
          dailyFees
        }
      }
    `;

    const data = await subgraphRequest(query, { first: days });
    return res.json({ data, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err }, "vault/history error");
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vault/compounds?first=10
 * Returns recent compound events.
 */
router.get("/vault/compounds", async (req, res) => {
  const first = Math.min(Number(req.query.first) || 10, 100);

  try {
    if (!isSubgraphConfigured()) {
      return res.json({
        data: {
          compounds: Array.from({ length: Math.min(first, 5) }, (_, i) => ({
            id: `0xcompound${i}`,
            totalRewards: String((8500 - i * 200) * 1e18),
            fee:           String((850  - i * 20)  * 1e18),
            amountCompounded: String((7650 - i * 180) * 1e18),
            blockNumber: String(1892341 - i * 2000),
            timestamp:   String(Math.floor(Date.now() / 1000) - i * 86400 * 7),
          })),
        },
        source: "mock",
      });
    }

    const query = `
      query RecentCompounds($first: Int!) {
        compounds(first: $first, orderBy: timestamp, orderDirection: desc) {
          id
          totalRewards
          fee
          amountCompounded
          transactionHash
          blockNumber
          timestamp
        }
      }
    `;

    const data = await subgraphRequest(query, { first });
    return res.json({ data, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err }, "vault/compounds error");
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vault/activity
 * Recent protocol-wide activity feed (deposits + withdrawals + compounds).
 */
router.get("/vault/activity", async (req, res) => {
  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: { activity: mockRecentActivity() }, source: "mock" });
    }

    const query = `
      query RecentActivity {
        deposits(first: 5, orderBy: timestamp, orderDirection: desc) {
          user { id }
          tokenId
          value
          timestamp
        }
        withdrawals(first: 5, orderBy: timestamp, orderDirection: desc) {
          user { id }
          tokenId
          value
          timestamp
        }
        compounds(first: 3, orderBy: timestamp, orderDirection: desc) {
          totalRewards
          amountCompounded
          timestamp
        }
      }
    `;

    const raw = await subgraphRequest<any>(query);
    const activity = [
      ...(raw.deposits  || []).map((d: any) => ({ type: "deposit",  ...d })),
      ...(raw.withdrawals || []).map((w: any) => ({ type: "withdraw", ...w })),
      ...(raw.compounds  || []).map((c: any) => ({ type: "compound", ...c })),
    ].sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 10);

    return res.json({ data: { activity }, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err }, "vault/activity error");
    return res.status(500).json({ error: err.message });
  }
});

export default router;
