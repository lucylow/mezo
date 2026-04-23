import { Router } from "express";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import { mockVaultStats } from "../lib/subgraph/mock";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/public/vault-stats
 * CORS-friendly JSON for integrations (wallets, partner dashboards).
 */
router.get("/public/vault-stats", async (_req, res) => {
  try {
    if (!isSubgraphConfigured()) {
      const { vault, dailyMetrics } = mockVaultStats();
      return res
        .status(200)
        .set({
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        })
        .json({
          tvl: vault.totalUnderlying,
          totalShares: vault.totalShares,
          totalCompounded: vault.totalCompounded,
          totalFeesCollected: vault.totalFeesCollected,
          totalDeposits: vault.totalDeposits,
          performanceFee: vault.performanceFee / 100,
          lastCompoundTime: vault.lastCompoundTime,
          historicalData: dailyMetrics.map((m) => ({
            date: new Date(m.date * 86400 * 1000).toISOString().split("T")[0],
            tvl: m.tvl,
            dailyRewards: m.dailyRewards,
            dailyFees: m.dailyFees,
          })),
          source: "mock",
        });
    }

    const query = `
      query PublicVaultStats {
        vault(id: "vemezo-auto-compounder") {
          totalUnderlying
          totalShares
          totalCompounded
          totalFeesCollected
          totalDeposits
          performanceFee
          lastCompoundTime
        }
        dailyMetrics(first: 30, orderBy: date, orderDirection: desc) {
          date
          tvl
          dailyRewards
          dailyFees
          totalUsers
        }
      }
    `;

    const data = await subgraphRequest<{
      vault: Record<string, unknown> | null;
      dailyMetrics: Array<Record<string, unknown>>;
    }>(query);

    const v = data.vault;
    if (!v) {
      return res.status(404).json({ error: "Vault not indexed" });
    }

    return res
      .status(200)
      .set({
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      })
      .json({
        tvl: v.totalUnderlying,
        totalShares: v.totalShares,
        totalCompounded: v.totalCompounded,
        totalFeesCollected: v.totalFeesCollected,
        totalDeposits: v.totalDeposits,
        performanceFee: Number(v.performanceFee) / 100,
        lastCompoundTime: v.lastCompoundTime,
        historicalData: (data.dailyMetrics ?? []).map((m) => ({
          date: new Date(Number(m.date) * 86400 * 1000).toISOString().split("T")[0],
          tvl: m.tvl,
          dailyRewards: m.dailyRewards,
          dailyFees: m.dailyFees,
          users: m.totalUsers,
        })),
        source: "subgraph",
      });
  } catch (err: unknown) {
    logger.error({ err }, "public/vault-stats error");
    return res.status(500).json({ error: err instanceof Error ? err.message : "error" });
  }
});

export default router;
