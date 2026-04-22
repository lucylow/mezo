/**
 * Typed fetch client for the Express API server.
 * Base URL is inferred from the Vite dev proxy; in production the frontend
 * and API are co-hosted under the same domain.
 */

const BASE = import.meta.env.VITE_API_URL ?? "";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}/api${path}`, window.location.href);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(0, path, `Request timed out: GET ${path}`);
    }
    throw new ApiError(0, path, `Network error: GET ${path} — ${(err as Error).message}`);
  }

  if (!res.ok) {
    let message = `API ${path} → ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore JSON parse errors on error bodies
    }
    throw new ApiError(res.status, path, message);
  }

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
  } | null;
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
  deposits: Array<{
    tokenId: string;
    value: string;
    shares: string;
    timestamp: string;
    transactionHash?: string;
  }>;
  withdrawals: Array<{
    tokenId: string;
    value: string;
    shares: string;
    timestamp: string;
    transactionHash?: string;
  }>;
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

export { ApiError };
