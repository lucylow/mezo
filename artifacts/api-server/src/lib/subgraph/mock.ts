/**
 * Realistic mock data returned when GOLDSTY_SUBGRAPH_URL is not set.
 * Mirrors the exact shape of what the Goldsky subgraph returns so the
 * frontend can develop against it before the contract is deployed.
 */

const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400;

export function mockVaultStats() {
  return {
    vault: {
      id: "vemezo-auto-compounder",
      totalUnderlying: "4200000000000000000000000",
      totalShares: "3850000000000000000000000",
      performanceFee: 1000,
      lastCompoundTime: String(NOW - 3 * DAY),
      totalDeposits: 1234,
      totalCompounded: "312000000000000000000000",
      totalFeesCollected: "34600000000000000000000",
      createdAt: String(NOW - 180 * DAY),
      updatedAt: String(NOW - 3 * DAY),
    },
    dailyMetrics: Array.from({ length: 7 }, (_, i) => ({
      date: Math.floor(NOW / DAY) - (6 - i),
      tvl: String(BigInt("3900000000000000000000000") + BigInt(i) * BigInt("50000000000000000000000")),
      dailyRewards: String(BigInt("8500000000000000000000") + BigInt(i) * BigInt("500000000000000000000")),
      dailyFees: String(BigInt("850000000000000000000") + BigInt(i) * BigInt("50000000000000000000")),
    })),
  };
}

export function mockUserPosition(address: string) {
  const isKnown = address.startsWith("0x");
  if (!isKnown) return { user: null };

  return {
    user: {
      id: address.toLowerCase(),
      shareBalance: "125000000000000000000",
      underlyingValue: "136500000000000000000",
      tokenIds: ["4092", "8821"],
      createdAt: String(NOW - 60 * DAY),
      updatedAt: String(NOW - 3 * DAY),
      deposits: [
        {
          tokenId: "4092",
          value: "1200000000000000000000",
          shares: "1200000000000000000000",
          transactionHash: "0xabc123",
          timestamp: String(NOW - 60 * DAY),
        },
        {
          tokenId: "8821",
          value: "450000000000000000000",
          shares: "450000000000000000000",
          transactionHash: "0xdef456",
          timestamp: String(NOW - 30 * DAY),
        },
      ],
      withdrawals: [],
    },
  };
}

export function mockHistoricalMetrics(days: number) {
  return {
    dailyMetrics: Array.from({ length: days }, (_, i) => ({
      date: Math.floor(NOW / DAY) - (days - 1 - i),
      tvl: String(BigInt("3500000000000000000000000") + BigInt(i) * BigInt("23000000000000000000000")),
      totalShares: String(BigInt("3200000000000000000000000") + BigInt(i) * BigInt("20000000000000000000000")),
      totalUsers: 800 + i * 3,
      dailyRewards: String(BigInt("7000000000000000000000") + BigInt(i) * BigInt("100000000000000000000")),
      dailyFees: String(BigInt("700000000000000000000") + BigInt(i) * BigInt("10000000000000000000")),
    })),
  };
}

export function mockRecentActivity() {
  return [
    { type: "deposit",  user: "0x4a...2f1", tokenId: "9912", value: "1200000000000000000000", timestamp: String(NOW - 600) },
    { type: "compound", user: "vault",       tokenId: null,   value: "45000000000000000000",  timestamp: String(NOW - 3600) },
    { type: "withdraw", user: "0x9b...1e3", tokenId: "4120", value: "500000000000000000000",  timestamp: String(NOW - 7200) },
    { type: "deposit",  user: "0x1c...8a4", tokenId: "3311", value: "3450000000000000000000", timestamp: String(NOW - 18000) },
    { type: "deposit",  user: "0x7d...4c2", tokenId: "7841", value: "800000000000000000000",  timestamp: String(NOW - 43200) },
  ];
}

export function mockKeeperStatus() {
  return {
    lastRun: String(NOW - 3 * DAY),
    nextRun: String(NOW + 4 * DAY),
    pendingRewards: "2847000000000000000000",
    depositedTokenCount: 1234,
    canCompound: false,
    gasPrice: "1000000000",
    estimatedGasCost: "247000000000000000",
    profitMargin: "0",
    lastTxHash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    lastBlockNumber: 1892341,
    network: "mezo-testnet",
    chainId: 31611,
  };
}
