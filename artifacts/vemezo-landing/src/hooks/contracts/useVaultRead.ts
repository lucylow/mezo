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
