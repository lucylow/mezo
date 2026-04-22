import { useAccount } from "wagmi";
import { useUserVaultPosition } from "./contracts/useVaultRead";
import { useUserAPIPosition } from "./api/useVaultAPI";

export interface UserPosition {
  /** Vault share balance (vveMEZO) */
  shares:       number;
  /** Alias kept for backward compatibility */
  vaultShares:  number;
  valueUSD:     number;
  earnedMEZO:   number;
  /** Alias kept for backward compatibility */
  earnedRewards: number;
  nftsLocked: Array<{ id: string; amount: number; unlockDate: string }>;
  tokenIds: string[];
  isLoading: boolean;
  source: string;
}

const DISCONNECTED: UserPosition = {
  shares: 0, vaultShares: 0, valueUSD: 0, earnedMEZO: 0, earnedRewards: 0,
  nftsLocked: [], tokenIds: [], isLoading: false, source: "disconnected",
};

/**
 * Unified user position hook with layered fallback:
 *   1. On-chain (wagmi) — when VITE_VAULT_ADDRESS is set
 *   2. API (/api/user/position) — when subgraph is indexed
 *   3. Mock data — when disconnected
 */
export function useUserPosition(): UserPosition {
  const { address, isConnected } = useAccount();

  const onChain = useUserVaultPosition(address);
  const api     = useUserAPIPosition(address);

  if (!isConnected || !address) return DISCONNECTED;

  // ── On-chain: has deposited token IDs ────────────────────────────────────
  if (onChain.tokenIds.length > 0) {
    const nftsLocked = onChain.tokenIds.map((tid, i) => ({
      id:          tid.toString(),
      amount:      0, // would need a second read for balanceOfNFT per token
      unlockDate:  "—",
    }));
    return {
      shares:       0,
      vaultShares:  0,
      valueUSD:     0,
      earnedMEZO:   0,
      earnedRewards: 0,
      nftsLocked,
      tokenIds: onChain.tokenIds.map(String),
      isLoading: onChain.isLoading,
      source: "on-chain",
    };
  }

  // ── API: subgraph indexed position ────────────────────────────────────────
  if (api.data) {
    const nftsLocked = api.data.tokenIds.map((id) => ({
      id,
      amount:     0,
      unlockDate: "—",
    }));
    return {
      shares:        api.data.shareBalance,
      vaultShares:   api.data.shareBalance,
      valueUSD:      api.data.underlyingValue * 1, // placeholder until price feed
      earnedMEZO:    0,
      earnedRewards: 0,
      nftsLocked,
      tokenIds:  api.data.tokenIds,
      isLoading: false,
      source:    api.data.source,
    };
  }

  if (api.isLoading || onChain.isLoading) {
    return { ...DISCONNECTED, isLoading: true, source: "loading" };
  }

  // ── Mock data (connected but pre-deployment) ──────────────────────────────
  return {
    shares:        1250,
    vaultShares:   1250,
    valueUSD:      340_000,
    earnedMEZO:    154.2,
    earnedRewards: 154.2,
    nftsLocked: [
      { id: "1042", amount: 500, unlockDate: "2025-12-01" },
      { id: "2891", amount: 750, unlockDate: "2026-06-15" },
    ],
    tokenIds: ["1042", "2891"],
    isLoading: false,
    source: "mock",
  };
}
