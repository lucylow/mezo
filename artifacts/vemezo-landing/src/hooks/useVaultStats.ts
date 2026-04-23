import { useVaultContractStats } from "./contracts/useVaultRead";
import { useVaultAPIStats } from "./api/useVaultAPI";

export type VaultStatsSource = "on-chain" | "api" | "mock" | "loading" | "error";

export interface VaultStats {
  tvl:                 number;
  projectedAPR:      number;
  pendingRewards:    number;
  performanceFee:    number;
  totalShares:       number;
  lastCompoundTime:  number;
  /** Cumulative performance fees in MUSD (on-chain counter when DEX fee path is used, else API/subgraph). */
  totalFeesCollected: number;
  isLoading:         boolean;
  isError:           boolean;
  source:            VaultStatsSource;
}

/**
 * Unified vault stats hook with layered fallback:
 *   1. On-chain (wagmi readContracts)   — when VITE_VAULT_ADDRESS is set
 *   2. API (Express /api/vault/stats)   — always live once contract events indexed
 *   3. Static mock                      — never fails; keeps the UI functional
 */
export function useVaultStats(): VaultStats {
  const onChain = useVaultContractStats();
  const api     = useVaultAPIStats();

  // ── Loading ───────────────────────────────────────────────────────────────
  if ((onChain.deployed && onChain.isLoading) || (api.isLoading && !api.data)) {
    return {
      tvl: 0, projectedAPR: 0, pendingRewards: 0,
      performanceFee: 10, totalShares: 0, lastCompoundTime: 0, totalFeesCollected: 0,
      isLoading: true, isError: false, source: "loading",
    };
  }

  // ── On-chain (live data, highest priority) ────────────────────────────────
  if (onChain.deployed && !onChain.isLoading && onChain.tvl !== undefined) {
    const onChainFees = onChain.totalFeesCollectedMusd ?? 0;
    const apiFees = api.data?.totalFeesCollected ?? 0;
    return {
      tvl:              onChain.tvl,
      projectedAPR:     78,             // APR is derived from analytics, not on-chain
      pendingRewards:   onChain.pendingRewards  ?? 0,
      performanceFee:   onChain.performanceFee  ?? 10,
      totalShares:      onChain.totalShares     ?? 0,
      lastCompoundTime: onChain.lastCompoundTime ?? 0,
      totalFeesCollected: onChainFees > 0 ? onChainFees : apiFees,
      isLoading:        false,
      isError:          false,
      source:           "on-chain",
    };
  }

  // ── API (subgraph / mock data from Express) ───────────────────────────────
  if (api.data) {
    return {
      tvl:              api.data.tvl,
      projectedAPR:     78,
      pendingRewards:   0,              // live pending rewards require a node call
      performanceFee:   api.data.performanceFee,
      totalShares:      api.data.totalShares,
      lastCompoundTime: api.data.lastCompoundTime,
      totalFeesCollected: api.data.totalFeesCollected ?? 0,
      isLoading:        false,
      isError:          false,
      source:           api.data.source === "mock" ? "mock" : "api",
    };
  }

  // ── Both sources failed — static fallback ─────────────────────────────────
  const isError = api.isError && !onChain.deployed;
  return {
    tvl:             4_200_000,
    projectedAPR:    78,
    pendingRewards:  2847,
    performanceFee:  10,
    totalShares:     15420,
    lastCompoundTime: 0,
    totalFeesCollected: 34_600,
    isLoading:       false,
    isError,
    source:          "mock",
  };
}
