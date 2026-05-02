import { useAccount } from "wagmi";
import { useUserVaultPosition, useNFTUnlockTimes } from "./contracts/useVaultRead";
import { useUserAPIPosition } from "./api/useVaultAPI";

export interface NFTPosition {
  id:          string;
  amount:      number;
  unlockDate:  string;
  /** Unix timestamp (seconds) when the vault's deposit lock expires. 0 = unknown/not deposited. */
  depositUnlockAt: number;
  /** True when the vault deposit lock period has NOT yet elapsed. */
  depositLocked:   boolean;
}

export interface UserPosition {
  /** Vault share balance (vveMEZO) */
  shares:        number;
  /** Alias for shares — kept for backward compatibility */
  vaultShares:   number;
  valueUSD:      number;
  earnedMEZO:    number;
  /** Alias for earnedMEZO — kept for backward compatibility */
  earnedRewards: number;
  nftsLocked:    NFTPosition[];
  tokenIds:      string[];
  isLoading:     boolean;
  isError:       boolean;
  source:        string;
}

const ZERO: UserPosition = {
  shares: 0, vaultShares: 0, valueUSD: 0, earnedMEZO: 0, earnedRewards: 0,
  nftsLocked: [], tokenIds: [], isLoading: false, isError: false,
  source: "disconnected",
};

/** Return seconds remaining until the deposit lock expires (≥0). */
function lockSecondsLeft(unlockAt: number): number {
  if (!unlockAt) return 0;
  return Math.max(0, unlockAt - Math.floor(Date.now() / 1000));
}

/**
 * Unified user position hook with layered fallback:
 *   1. On-chain (wagmi)                — when VITE_VAULT_ADDRESS is set
 *   2. API (/api/user/position)        — when subgraph is indexed
 *   3. Mock data                       — when connected but pre-deployment
 */
export function useUserPosition(): UserPosition {
  const { address, isConnected } = useAccount();

  const onChain = useUserVaultPosition(address);
  const api     = useUserAPIPosition(address);

  // Fetch vault deposit-lock expiry times for all on-chain token IDs
  const { unlockMap, isLoading: unlockLoading } = useNFTUnlockTimes(onChain.tokenIds);

  if (!isConnected || !address) return ZERO;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (onChain.isLoading || unlockLoading || (api.isLoading && !api.data)) {
    return { ...ZERO, isLoading: true, source: "loading" };
  }

  // ── On-chain: deposited token IDs ─────────────────────────────────────────
  if (onChain.tokenIds.length > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    const nftsLocked: NFTPosition[] = onChain.tokenIds.map((tid) => {
      const depositUnlockAt = unlockMap[tid.toString()] ?? 0;
      return {
        id:              tid.toString(),
        amount:          0,
        unlockDate:      "—",
        depositUnlockAt,
        depositLocked:   depositUnlockAt > 0 && depositUnlockAt > nowSec,
      };
    });
    return {
      shares:        0,
      vaultShares:   0,
      valueUSD:      0,
      earnedMEZO:    0,
      earnedRewards: 0,
      nftsLocked,
      tokenIds:  onChain.tokenIds.map(String),
      isLoading: false,
      isError:   false,
      source:    "on-chain",
    };
  }

  // ── API: subgraph indexed position ────────────────────────────────────────
  if (api.data) {
    const nftsLocked: NFTPosition[] = api.data.tokenIds.map((id) => ({
      id,
      amount:          0,
      unlockDate:      "—",
      depositUnlockAt: 0,
      depositLocked:   false,
    }));
    return {
      shares:        api.data.shareBalance,
      vaultShares:   api.data.shareBalance,
      valueUSD:      api.data.underlyingValue,
      earnedMEZO:    0,
      earnedRewards: 0,
      nftsLocked,
      tokenIds:  api.data.tokenIds,
      isLoading: false,
      isError:   false,
      source:    api.data.source,
    };
  }

  // ── API error with no cached data ─────────────────────────────────────────
  if (api.isError) {
    return { ...ZERO, isError: true, source: "error" };
  }

  // ── Mock data (connected, pre-deployment, API not yet indexing) ───────────
  const nowSec = Math.floor(Date.now() / 1000);
  // Simulate NFT #1042 still locked (unlocks 7 days from now), #2891 unlocked
  const mockUnlock1 = nowSec + 7 * 24 * 3600;
  const mockUnlock2 = nowSec - 3600; // already past
  return {
    shares:        1250,
    vaultShares:   1250,
    valueUSD:      340_000,
    earnedMEZO:    154.2,
    earnedRewards: 154.2,
    nftsLocked: [
      {
        id: "1042", amount: 500,  unlockDate: "2025-12-01",
        depositUnlockAt: mockUnlock1,
        depositLocked:   true,
      },
      {
        id: "2891", amount: 750,  unlockDate: "2026-06-15",
        depositUnlockAt: mockUnlock2,
        depositLocked:   false,
      },
    ],
    tokenIds:  ["1042", "2891"],
    isLoading: false,
    isError:   false,
    source:    "mock",
  };
}

/** Format seconds remaining as "Xd Xh Xm" */
export function formatLockCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return "Unlocked";
  const d = Math.floor(secondsLeft / 86_400);
  const h = Math.floor((secondsLeft % 86_400) / 3_600);
  const m = Math.floor((secondsLeft % 3_600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
