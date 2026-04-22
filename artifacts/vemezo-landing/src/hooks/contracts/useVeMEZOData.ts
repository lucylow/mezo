import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, VeMEZOABI, isContractDeployed } from "@/lib/contracts";

export interface VeMEZONFT {
  tokenId: bigint;
  value:      bigint;
  lockAmount: bigint;
  lockEnd:    Date;
  valueFormatted: string;
}

/**
 * Returns all veMEZO NFTs owned by `address` with their lock details.
 * Disabled when the contract is not deployed.
 */
export function useVeMEZONFTs(address?: `0x${string}`) {
  const deployed = isContractDeployed();

  const { data: rawIds } = useReadContract({
    address: CONTRACTS.VEMEZO,
    abi: VeMEZOABI,
    functionName: "tokensOfOwner",
    args: address ? [address] : undefined,
    query: { enabled: deployed && !!address },
  });

  const tokenIds = (rawIds as bigint[] | undefined) ?? [];

  const { data: details, isLoading } = useReadContracts({
    contracts: tokenIds.flatMap((tid) => [
      { address: CONTRACTS.VEMEZO, abi: VeMEZOABI, functionName: "balanceOfNFT" as const, args: [tid] },
      { address: CONTRACTS.VEMEZO, abi: VeMEZOABI, functionName: "locked"        as const, args: [tid] },
    ]),
    query: { enabled: deployed && tokenIds.length > 0 },
  });

  const nfts: VeMEZONFT[] = [];
  for (let i = 0; i < tokenIds.length; i++) {
    const value  = details?.[i * 2]?.result     as bigint | undefined;
    const locked = details?.[i * 2 + 1]?.result as [bigint, bigint] | undefined;
    if (value && locked) {
      nfts.push({
        tokenId:        tokenIds[i],
        value,
        lockAmount:     locked[0],
        lockEnd:        new Date(Number(locked[1]) * 1000),
        valueFormatted: formatEther(value),
      });
    }
  }

  return { nfts, isLoading: deployed ? isLoading : false };
}

/**
 * Check whether a veMEZO NFT is approved for the vault to transfer.
 */
export function useVeMEZOApproval(address?: `0x${string}`) {
  const deployed = isContractDeployed();

  const { data } = useReadContract({
    address: CONTRACTS.VEMEZO,
    abi: VeMEZOABI,
    functionName: "isApprovedForAll",
    args: address ? [address, CONTRACTS.VAULT] : undefined,
    query: { enabled: deployed && !!address },
  });

  return { isApprovedForAll: Boolean(data) };
}
