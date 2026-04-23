import { useReadContracts, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONTRACTS, ReferralManagerABI, isReferralManagerDeployed } from "@/lib/contracts";

function extractMessage(err: unknown): string {
  if (err instanceof Error) return (err as { shortMessage?: string }).shortMessage ?? err.message;
  return "Unknown error";
}

export function useReferral(address?: `0x${string}`) {
  const qc = useQueryClient();
  const deployed = isReferralManagerDeployed();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: address
      ? [
          {
            address: CONTRACTS.REFERRAL_MANAGER,
            abi: ReferralManagerABI,
            functionName: "referralCodeOf",
            args: [address],
          },
          {
            address: CONTRACTS.REFERRAL_MANAGER,
            abi: ReferralManagerABI,
            functionName: "referrerOf",
            args: [address],
          },
          {
            address: CONTRACTS.REFERRAL_MANAGER,
            abi: ReferralManagerABI,
            functionName: "totalReferralRewards",
            args: [address],
          },
        ]
      : [],
    query: { enabled: deployed && !!address },
  });

  const referralCode = (data?.[0]?.result as string | undefined) ?? "";
  const referrer = (data?.[1]?.result as `0x${string}` | undefined) ?? undefined;
  const rewardsWei = data?.[2]?.result as bigint | undefined;
  const totalRewards = rewardsWei ? Number(formatEther(rewardsWei)) : 0;

  const setReferralCode = async (code: string) => {
    if (!deployed) return;
    try {
      await writeContractAsync({
        address: CONTRACTS.REFERRAL_MANAGER,
        abi: ReferralManagerABI,
        functionName: "setReferralCode",
        args: [code],
      });
      toast.success("Referral code submitted");
      qc.invalidateQueries({ queryKey: ["readContracts"] });
      await refetch();
    } catch (e) {
      toast.error(extractMessage(e));
    }
  };

  const claimRewards = async () => {
    if (!deployed) return;
    try {
      await writeContractAsync({
        address: CONTRACTS.REFERRAL_MANAGER,
        abi: ReferralManagerABI,
        functionName: "claimReferralRewards",
        args: [],
      });
      toast.success("Rewards claimed");
      await refetch();
    } catch (e) {
      toast.error(extractMessage(e));
    }
  };

  return {
    referralCode,
    referrer,
    totalRewards,
    setReferralCode,
    claimRewards,
    isPending,
    isLoading: deployed && !!address ? isLoading : false,
    deployed,
  };
}
