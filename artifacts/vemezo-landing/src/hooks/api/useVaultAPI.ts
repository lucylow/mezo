import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import {
  fetchVaultStats,
  fetchVaultHistory,
  fetchUserPosition,
  fetchVaultActivity,
  fetchKeeperStatus,
} from "@/lib/api/client";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely convert a string/number to a BigInt, returning 0n on failure. */
function safeBigInt(value: unknown): bigint {
  if (value === null || value === undefined || value === "") return 0n;
  try {
    return BigInt(String(value));
  } catch {
    return 0n;
  }
}

/** Format a string/number that represents a uint256 (18 decimals) as a JS number. */
function formatWei(value: unknown): number {
  return Number(formatUnits(safeBigInt(value), 18));
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Vault-level metrics from the Express API (backed by Goldsky or mock). */
export function useVaultAPIStats() {
  return useQuery({
    queryKey: ["api", "vault-stats"],
    queryFn:  fetchVaultStats,
    staleTime: 30_000,
    retry: 2,
    select: (res) => {
      const v = res.data?.vault;
      if (!v) return null;
      return {
        tvl:              formatWei(v.totalUnderlying),
        totalShares:      formatWei(v.totalShares),
        performanceFee:   typeof v.performanceFee === "number" ? v.performanceFee / 100 : 10,
        totalDeposits:    Number(v.totalDeposits ?? 0),
        totalCompounded:  formatWei(v.totalCompounded),
        totalFeesCollected: formatWei(v.totalFeesCollected),
        lastCompoundTime: Number(v.lastCompoundTime ?? 0),
        dailyMetrics:     res.data.dailyMetrics ?? [],
        treasuryMUSDValue: typeof res.data?.treasuryMUSDValue === "number"
          ? res.data.treasuryMUSDValue
          : 12_300,
        treasuryAPY: typeof res.data?.treasuryAPY === "number"
          ? res.data.treasuryAPY
          : 5,
        source:           res.source ?? "api",
      };
    },
  });
}

/** 30-day (default) history for charts. */
export function useVaultAPIHistory(days = 30) {
  return useQuery({
    queryKey: ["api", "vault-history", days],
    queryFn:  () => fetchVaultHistory(days),
    staleTime: 60_000,
    retry: 2,
    select: (res) =>
      (res.data?.dailyMetrics ?? []).map((m) => ({
        date:         Number(m.date),
        tvl:          formatWei(m.tvl),
        dailyRewards: formatWei(m.dailyRewards),
        dailyFees:    formatWei(m.dailyFees),
        totalUsers:   Number(m.totalUsers ?? 0),
      })),
  });
}

/** Per-user vault position from the API. */
export function useUserAPIPosition(address?: string) {
  return useQuery({
    queryKey: ["api", "user-position", address],
    queryFn:  () => fetchUserPosition(address!),
    enabled:  !!address,
    staleTime: 15_000,
    retry: 1,
    select: (res) => {
      const u = res.data?.user;
      if (!u) return null;
      return {
        shareBalance:    formatWei(u.shareBalance),
        underlyingValue: formatWei(u.underlyingValue),
        tokenIds:        Array.isArray(u.tokenIds) ? u.tokenIds : [],
        deposits:        Array.isArray(u.deposits)    ? u.deposits    : [],
        withdrawals:     Array.isArray(u.withdrawals) ? u.withdrawals : [],
        source:          res.source ?? "api",
      };
    },
  });
}

/** Protocol activity feed. */
export function useVaultActivityFeed() {
  return useQuery({
    queryKey: ["api", "vault-activity"],
    queryFn:  fetchVaultActivity,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
    select: (res) => res.data?.activity ?? [],
  });
}

/** Keeper bot status. */
export function useKeeperStatus() {
  return useQuery({
    queryKey: ["api", "keeper-status"],
    queryFn:  fetchKeeperStatus,
    staleTime: 60_000,
    retry: 2,
    select: (res) => res.data,
  });
}
