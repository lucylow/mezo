import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import {
  fetchVaultStats,
  fetchVaultHistory,
  fetchUserPosition,
  fetchVaultActivity,
  fetchKeeperStatus,
} from "@/lib/api/client";

/** Vault-level metrics from the Express API (backed by Goldsky or mock). */
export function useVaultAPIStats() {
  return useQuery({
    queryKey: ["api", "vault-stats"],
    queryFn:  fetchVaultStats,
    staleTime: 30_000,
    select: (res) => {
      const v = res.data.vault;
      if (!v) return null;
      return {
        tvl:             Number(formatUnits(BigInt(v.totalUnderlying), 18)),
        totalShares:     Number(formatUnits(BigInt(v.totalShares), 18)),
        performanceFee:  v.performanceFee / 100,
        totalDeposits:   v.totalDeposits,
        totalCompounded: Number(formatUnits(BigInt(v.totalCompounded), 18)),
        lastCompoundTime: Number(v.lastCompoundTime),
        dailyMetrics:    res.data.dailyMetrics,
        source:          res.source,
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
    select: (res) =>
      res.data.dailyMetrics.map((m) => ({
        date:         m.date,
        tvl:          Number(formatUnits(BigInt(m.tvl), 18)),
        dailyRewards: Number(formatUnits(BigInt(m.dailyRewards), 18)),
        dailyFees:    Number(formatUnits(BigInt(m.dailyFees), 18)),
        totalUsers:   m.totalUsers ?? 0,
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
    select: (res) => {
      const u = res.data.user;
      if (!u) return null;
      return {
        shareBalance:    Number(formatUnits(BigInt(u.shareBalance), 18)),
        underlyingValue: Number(formatUnits(BigInt(u.underlyingValue), 18)),
        tokenIds:        u.tokenIds,
        deposits:        u.deposits,
        withdrawals:     u.withdrawals,
        source:          res.source,
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
    select: (res) => res.data.activity,
  });
}

/** Keeper bot status. */
export function useKeeperStatus() {
  return useQuery({
    queryKey: ["api", "keeper-status"],
    queryFn:  fetchKeeperStatus,
    staleTime: 60_000,
    select: (res) => res.data,
  });
}
