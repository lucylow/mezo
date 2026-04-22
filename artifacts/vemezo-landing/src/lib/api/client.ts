/**
 * Typed fetch client for the Express API server.
 * Base URL is inferred from the Vite dev proxy; in production the frontend
 * and API are co-hosted under the same domain.
 */

const BASE = import.meta.env.VITE_API_URL ?? "";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}/api${path}`, window.location.href);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Vault ─────────────────────────────────────────────────────────────────────

export interface VaultStatsData {
  vault: {
    id: string;
    totalUnderlying: string;
    totalShares: string;
    performanceFee: number;
    lastCompoundTime: string;
    totalDeposits: number;
    totalCompounded: string;
    totalFeesCollected: string;
  };
  dailyMetrics: Array<{
    date: number;
    tvl: string;
    dailyRewards: string;
    dailyFees: string;
    totalUsers?: number;
  }>;
}

export function fetchVaultStats() {
  return get<{ data: VaultStatsData; source: string }>("/vault/stats");
}

export function fetchVaultHistory(days = 30) {
  return get<{ data: { dailyMetrics: VaultStatsData["dailyMetrics"] }; source: string }>(
    "/vault/history",
    { days: String(days) },
  );
}

export function fetchVaultActivity() {
  return get<{
    data: {
      activity: Array<{
        type: "deposit" | "withdraw" | "compound";
        user?: string;
        tokenId?: string | null;
        value?: string;
        timestamp: string;
      }>;
    };
    source: string;
  }>("/vault/activity");
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserPositionData {
  id: string;
  shareBalance: string;
  underlyingValue: string;
  tokenIds: string[];
  deposits: Array<{ tokenId: string; value: string; shares: string; timestamp: string; transactionHash?: string }>;
  withdrawals: Array<{ tokenId: string; value: string; shares: string; timestamp: string; transactionHash?: string }>;
}

export function fetchUserPosition(address: string) {
  return get<{ data: { user: UserPositionData | null }; source: string }>(
    "/user/position",
    { address: address.toLowerCase() },
  );
}

export function fetchUserNFTs(address: string) {
  return get<{ data: { tokenIds: string[] }; source: string }>(
    "/user/nfts",
    { address: address.toLowerCase() },
  );
}

// ── Keeper ────────────────────────────────────────────────────────────────────

export function fetchKeeperStatus() {
  return get<{
    data: {
      lastRun: string;
      nextRun: string;
      pendingRewards: string;
      depositedTokenCount: number;
      canCompound: boolean;
      lastTxHash: string | null;
      lastBlockNumber: number;
      network: string;
      chainId: number;
    };
    source: string;
  }>("/keeper/status");
}
