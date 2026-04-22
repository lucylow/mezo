import { useAccount } from "wagmi";
import { useUserVaultPosition } from "./contracts/useVaultRead";
import { useUserAPIPosition } from "./api/useVaultAPI";

export interface NFTPosition {
  id:          string;
  amount:      number;
  unlockDate:  string;
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

  if (!isConnected || !address) return ZERO;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (onChain.isLoading || (api.isLoading && !api.data)) {
    return { ...ZERO, isLoading: true, source: "loading" };
  }

  // ── On-chain: deposited token IDs ─────────────────────────────────────────
  if (onChain.tokenIds.length > 0) {
    const nftsLocked: NFTPosition[] = onChain.tokenIds.map((tid) => ({
      id:         tid.toString(),
      amount:     0,     // needs a second read per token; filled in by useVeMEZONFTs
      unlockDate: "—",
    }));
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
      amount:     0,
      unlockDate: "—",
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
    return {
      ...ZERO,
      isError: true,
      source:  "error",
    };
  }

  // ── Mock data (connected, pre-deployment, API not yet indexing) ───────────
  return {
    shares:        1250,
    vaultShares:   1250,
    valueUSD:      340_000,
    earnedMEZO:    154.2,
    earnedRewards: 154.2,
    nftsLocked: [
      { id: "1042", amount: 500,  unlockDate: "2025-12-01" },
      { id: "2891", amount: 750,  unlockDate: "2026-06-15" },
    ],
    tokenIds:  ["1042", "2891"],
    isLoading: false,
    isError:   false,
    source:    "mock",
  };
}
