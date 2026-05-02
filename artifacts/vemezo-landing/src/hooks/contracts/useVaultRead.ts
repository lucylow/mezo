import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, VeMEZOVaultABI, isContractDeployed } from "@/lib/contracts";

/**
 * Reads live vault-level stats directly from the on-chain contract.
 * Returns undefined values when the contract is not yet deployed.
 */
export function useVaultContractStats() {
  const deployed = isContractDeployed();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "totalUnderlying" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "performanceFee" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "getPendingRewards" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "getDepositedTokenCount" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "lastCompoundTime" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "totalFeesCollectedMusd" },
    ],
    query: { enabled: deployed },
  });

  const totalUnderlying       = data?.[0]?.result as bigint | undefined;
  const performanceFee        = data?.[1]?.result as bigint | undefined;
  const pendingRewards        = data?.[2]?.result as bigint | undefined;
  const tokenCount            = data?.[3]?.result as bigint | undefined;
  const lastCompoundTime      = data?.[4]?.result as bigint | undefined;
  const totalFeesCollectedMusd = data?.[5]?.result as bigint | undefined;

  return {
    deployed,
    tvl:              totalUnderlying   ? Number(formatEther(totalUnderlying))  : undefined,
    performanceFee:   performanceFee    ? Number(performanceFee) / 100          : undefined,
    pendingRewards:   pendingRewards    ? Number(formatEther(pendingRewards))   : undefined,
    totalShares:      tokenCount        ? Number(tokenCount)                    : undefined,
    lastCompoundTime: lastCompoundTime  ? Number(lastCompoundTime)              : undefined,
    totalFeesCollectedMusd: totalFeesCollectedMusd
      ? Number(formatEther(totalFeesCollectedMusd))
      : undefined,
    isLoading: deployed ? isLoading : false,
    refetch,
  };
}

/**
 * Reads a specific user's vault position from the on-chain contract.
 */
export function useUserVaultPosition(address?: `0x${string}`) {
  const deployed = isContractDeployed();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: address ? [
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "getUserTokenIds", args: [address] },
    ] : [],
    query: { enabled: deployed && !!address },
  });

  const tokenIds = data?.[0]?.result as bigint[] | undefined;

  return {
    tokenIds:  tokenIds || [],
    isLoading: deployed && !!address ? isLoading : false,
    refetch,
  };
}

/**
 * Reads vault security parameters: deposit lock duration, swap slippage cap,
 * compound cooldown interval, and the primary keeper address.
 */
export function useVaultSecurityParams() {
  const deployed = isContractDeployed();

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "minDepositDuration" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "swapSlippageBps" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "minCompoundInterval" },
      { address: CONTRACTS.VAULT, abi: VeMEZOVaultABI, functionName: "keeper" },
    ],
    query: { enabled: deployed },
  });

  const minDepositDurationRaw = data?.[0]?.result as bigint | undefined;
  const swapSlippageBpsRaw    = data?.[1]?.result as bigint | undefined;
  const minCompoundIntervalRaw = data?.[2]?.result as bigint | undefined;
  const keeper                = data?.[3]?.result as `0x${string}` | undefined;

  return {
    /** Minimum vault deposit duration in seconds before withdrawal is allowed (default 7 days = 604800). */
    minDepositDuration:  minDepositDurationRaw  ? Number(minDepositDurationRaw)  : 604_800,
    /** Swap slippage cap in basis points (default 100 = 1%). */
    swapSlippageBps:     swapSlippageBpsRaw     ? Number(swapSlippageBpsRaw)     : 100,
    /** Minimum seconds between compound executions (default 3600 = 1 hr). */
    minCompoundInterval: minCompoundIntervalRaw ? Number(minCompoundIntervalRaw) : 3_600,
    /** Primary keeper address. */
    keeper,
    isLoading: deployed ? isLoading : false,
  };
}

/**
 * Reads `depositUnlockTime(tokenId)` for each provided token ID.
 * Returns a map from tokenId (string) → unix timestamp (number, 0 = not deposited).
 */
export function useNFTUnlockTimes(tokenIds: bigint[]) {
  const deployed = isContractDeployed();

  const { data, isLoading } = useReadContracts({
    contracts: tokenIds.map((tid) => ({
      address: CONTRACTS.VAULT,
      abi:     VeMEZOVaultABI,
      functionName: "depositUnlockTime" as const,
      args:    [tid],
    })),
    query: { enabled: deployed && tokenIds.length > 0 },
  });

  const unlockMap: Record<string, number> = {};
  tokenIds.forEach((tid, i) => {
    const raw = data?.[i]?.result as bigint | undefined;
    unlockMap[tid.toString()] = raw ? Number(raw) : 0;
  });

  return { unlockMap, isLoading: deployed && tokenIds.length > 0 ? isLoading : false };
}
