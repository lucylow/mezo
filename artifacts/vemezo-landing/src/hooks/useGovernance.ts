import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, VaultGovernorABI, VeMEZOVaultABI, isGovernanceDeployed } from "@/lib/contracts";

// Proposal states from OpenZeppelin Governor
export const PROPOSAL_STATES = [
  "pending",
  "active",
  "canceled",
  "defeated",
  "succeeded",
  "queued",
  "expired",
  "executed",
] as const;

export type ProposalState = typeof PROPOSAL_STATES[number];

export interface OnChainProposal {
  id:           string;
  proposalId:   bigint;
  title:        string;
  description:  string;
  status:       ProposalState;
  forVotes:     number;
  againstVotes: number;
  abstainVotes: number;
  daysLeft:     number;
  author:       string;
}

/**
 * Hook for reading on-chain governance data and writing governance transactions.
 *
 * When the governance contracts are not yet deployed (address = zero) the hook
 * returns safe zero-value defaults so the page always renders.
 */
export function useGovernance() {
  const { address } = useAccount();
  const deployed = isGovernanceDeployed();

  // ── Vault token (vveMEZO) reads ──────────────────────────────────────────

  const { data: vaultTokenAddress } = useReadContract({
    address:      CONTRACTS.VAULT,
    abi:          VeMEZOVaultABI,
    functionName: "vaultToken",
    query: { enabled: !!CONTRACTS.VAULT && CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: userVotingPowerRaw } = useReadContract({
    address:      vaultTokenAddress as `0x${string}` | undefined,
    abi:          [{ type: "function", name: "getVotes", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "getVotes",
    args:         address ? [address] : undefined,
    query: { enabled: !!vaultTokenAddress && !!address },
  });

  const { data: userSharesRaw } = useReadContract({
    address:      vaultTokenAddress as `0x${string}` | undefined,
    abi:          [{ type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "balanceOf",
    args:         address ? [address] : undefined,
    query: { enabled: !!vaultTokenAddress && !!address },
  });

  const { data: totalSupplyRaw } = useReadContract({
    address:      vaultTokenAddress as `0x${string}` | undefined,
    abi:          [{ type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "totalSupply",
    query: { enabled: !!vaultTokenAddress },
  });

  // ── Pending fee rewards ───────────────────────────────────────────────────

  const { data: pendingRewardsRaw, refetch: refetchRewards } = useReadContract({
    address:      CONTRACTS.VAULT,
    abi:          VeMEZOVaultABI,
    functionName: "pendingFeeRewards",
    args:         address ? [address] : undefined,
    query: { enabled: !!address && CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000" },
  });

  // ── Governance reads ──────────────────────────────────────────────────────

  const { data: votingDelay } = useReadContract({
    address:      CONTRACTS.GOVERNOR,
    abi:          VaultGovernorABI,
    functionName: "votingDelay",
    query: { enabled: deployed },
  });

  const { data: votingPeriod } = useReadContract({
    address:      CONTRACTS.GOVERNOR,
    abi:          VaultGovernorABI,
    functionName: "votingPeriod",
    query: { enabled: deployed },
  });

  const { data: quorumAmount } = useReadContract({
    address:      CONTRACTS.GOVERNOR,
    abi:          VaultGovernorABI,
    functionName: "quorumAmount",
    query: { enabled: deployed },
  });

  // ── Write: claim fee rewards ──────────────────────────────────────────────

  const {
    writeContract: writeClaimRewards,
    data:          claimRewardsTxHash,
    isPending:     isClaimingRewards,
  } = useWriteContract();

  const { isLoading: isWaitingClaimRewards, isSuccess: claimRewardsSuccess } =
    useWaitForTransactionReceipt({ hash: claimRewardsTxHash });

  function claimRewards() {
    if (!address) return;
    writeClaimRewards({
      address:      CONTRACTS.VAULT,
      abi:          VeMEZOVaultABI,
      functionName: "claimFeeRewards",
    });
  }

  // ── Write: cast vote ──────────────────────────────────────────────────────

  const {
    writeContract: writeCastVote,
    data:          castVoteTxHash,
    isPending:     isCastingVote,
  } = useWriteContract();

  function castVote(proposalId: bigint, support: 0 | 1 | 2) {
    if (!address) return;
    writeCastVote({
      address:      CONTRACTS.GOVERNOR,
      abi:          VaultGovernorABI,
      functionName: "castVote",
      args:         [proposalId, support],
    });
  }

  function castVoteWithReason(proposalId: bigint, support: 0 | 1 | 2, reason: string) {
    if (!address) return;
    writeCastVote({
      address:      CONTRACTS.GOVERNOR,
      abi:          VaultGovernorABI,
      functionName: "castVoteWithReason",
      args:         [proposalId, support, reason],
    });
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const userVotingPower = userVotingPowerRaw
    ? parseFloat(formatUnits(userVotingPowerRaw as bigint, 18))
    : 0;

  const userShares = userSharesRaw
    ? parseFloat(formatUnits(userSharesRaw as bigint, 18))
    : 0;

  const totalSupply = totalSupplyRaw
    ? parseFloat(formatUnits(totalSupplyRaw as bigint, 18))
    : 0;

  const pendingRewards = pendingRewardsRaw
    ? parseFloat(formatUnits(pendingRewardsRaw as bigint, 18))
    : 0;

  const votingPowerPct = totalSupply > 0
    ? ((userVotingPower / totalSupply) * 100).toFixed(2)
    : "0.00";

  return {
    // Voting state
    userVotingPower,
    userShares,
    totalSupply,
    votingPowerPct,
    // Fee rewards
    pendingRewards,
    claimRewards,
    isClaimingRewards:    isClaimingRewards || isWaitingClaimRewards,
    claimRewardsSuccess,
    refetchRewards,
    // Vote actions
    castVote,
    castVoteWithReason,
    isCastingVote,
    // Governance params
    votingDelay:   votingDelay  ? Number(votingDelay)  : 7200,
    votingPeriod:  votingPeriod ? Number(votingPeriod) : 36000,
    quorumAmount:  quorumAmount ? parseFloat(formatUnits(quorumAmount as bigint, 18)) : 100_000,
    // Status
    isGovernanceDeployed: deployed,
  };
}
