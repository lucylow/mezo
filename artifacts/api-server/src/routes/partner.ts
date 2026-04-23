import { Router, type Request, type Response } from "express";

const router = Router();

function partnerKeys(): Set<string> {
  return new Set(
    [process.env.SPECTRUM_API_KEY, process.env.GOLDSKY_API_KEY, process.env.BOAR_API_KEY].filter(
      (k): k is string => typeof k === "string" && k.length > 0,
    ),
  );
}

/**
 * GET /api/partner/analytics
 * Enhanced metrics for trusted integrations (API key in `x-api-key`).
 */
router.get("/partner/analytics", (req: Request, res: Response) => {
  const keys = partnerKeys();
  const apiKey = req.headers["x-api-key"];

  if (typeof apiKey !== "string" || !keys.has(apiKey)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const metrics = {
    tvl: 12_450_000,
    tvlGrowth24h: 8.5,
    volume24h: 450_000,
    uniqueDepositors: 1250,
    avgPositionSize: 9960,
    topReferrers: [
      { code: "BOAR", referrals: 45, volume: 450_000 },
      { code: "SPECTRUM", referrals: 32, volume: 320_000 },
    ],
    feeDistribution: {
      performanceFee: 10,
      treasuryStaked: 75_000,
      treasuryAPY: 12.5,
    },
  };

  return res.json(metrics);
});

export default router;
