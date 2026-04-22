import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONTRACTS, VeMEZOVaultABI, VeMEZOABI } from "@/lib/contracts";
import { useTransactionStore } from "@/store/transactionStore";

function shortenHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

// ── Deposit ───────────────────────────────────────────────────────────────────

export function useDeposit() {
  const qc             = useQueryClient();
  const addTx          = useTransactionStore((s) => s.addTransaction);
  const updateTx       = useTransactionStore((s) => s.updateTransaction);
  const { writeContractAsync, isPending } = useWriteContract();

  const deposit = async (tokenId: bigint) => {
    const toastId = `deposit-${tokenId}`;
    try {
      // Step 1: approve
      toast.loading("Step 1/2 — Approving NFT transfer…", { id: toastId });
      await writeContractAsync({
        address: CONTRACTS.VEMEZO,
        abi: VeMEZOABI,
        functionName: "approve",
        args: [CONTRACTS.VAULT, tokenId],
      });

      // Step 2: deposit
      toast.loading("Step 2/2 — Depositing NFT…", { id: toastId });
      const hash = await writeContractAsync({
        address: CONTRACTS.VAULT,
        abi: VeMEZOVaultABI,
        functionName: "deposit",
        args: [tokenId],
      });

      addTx({ hash, type: "deposit", status: "pending", timestamp: Date.now(), amount: tokenId.toString() });
      toast.loading(`Confirming… ${shortenHash(hash)}`, { id: toastId });

      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Deposit failed", { id: toastId });
      throw err;
    }
  };

  const depositBatch = async (tokenIds: bigint[]) => {
    const toastId = "deposit-batch";
    try {
      toast.loading("Step 1/2 — Approving NFTs…", { id: toastId });
      for (const tid of tokenIds) {
        await writeContractAsync({
          address: CONTRACTS.VEMEZO,
          abi: VeMEZOABI,
          functionName: "approve",
          args: [CONTRACTS.VAULT, tid],
        });
      }

      toast.loading("Step 2/2 — Depositing NFTs…", { id: toastId });
      const hash = await writeContractAsync({
        address: CONTRACTS.VAULT,
        abi: VeMEZOVaultABI,
        functionName: "depositBatch",
        args: [tokenIds],
      });

      addTx({ hash, type: "deposit", status: "pending", timestamp: Date.now() });
      toast.loading(`Confirming… ${shortenHash(hash)}`, { id: toastId });
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Batch deposit failed", { id: toastId });
      throw err;
    }
  };

  return { deposit, depositBatch, isPending };
}

// ── Withdraw ──────────────────────────────────────────────────────────────────

export function useWithdraw() {
  const qc       = useQueryClient();
  const addTx    = useTransactionStore((s) => s.addTransaction);
  const { writeContractAsync, isPending } = useWriteContract();

  const withdraw = async (tokenId: bigint) => {
    const toastId = `withdraw-${tokenId}`;
    try {
      toast.loading("Withdrawing NFT…", { id: toastId });
      const hash = await writeContractAsync({
        address: CONTRACTS.VAULT,
        abi: VeMEZOVaultABI,
        functionName: "withdraw",
        args: [tokenId],
      });
      addTx({ hash, type: "withdraw", status: "pending", timestamp: Date.now(), amount: tokenId.toString() });
      toast.loading(`Confirming… ${shortenHash(hash)}`, { id: toastId });
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Withdrawal failed", { id: toastId });
      throw err;
    }
  };

  const withdrawByShares = async (shares: bigint) => {
    const toastId = "withdraw-shares";
    try {
      toast.loading("Withdrawing by shares…", { id: toastId });
      const hash = await writeContractAsync({
        address: CONTRACTS.VAULT,
        abi: VeMEZOVaultABI,
        functionName: "withdrawByShares",
        args: [shares],
      });
      addTx({ hash, type: "withdraw", status: "pending", timestamp: Date.now() });
      toast.loading(`Confirming… ${shortenHash(hash)}`, { id: toastId });
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Withdrawal failed", { id: toastId });
      throw err;
    }
  };

  return { withdraw, withdrawByShares, isPending };
}

// ── Compound ──────────────────────────────────────────────────────────────────

export function useCompound() {
  const addTx = useTransactionStore((s) => s.addTransaction);
  const { writeContractAsync, isPending } = useWriteContract();

  const compound = async () => {
    const toastId = "compound";
    try {
      toast.loading("Triggering compound…", { id: toastId });
      const hash = await writeContractAsync({
        address: CONTRACTS.VAULT,
        abi: VeMEZOVaultABI,
        functionName: "compoundAll",
      });
      addTx({ hash, type: "compound", status: "pending", timestamp: Date.now() });
      toast.loading(`Confirming… ${shortenHash(hash)}`, { id: toastId });
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Compound failed", { id: toastId });
      throw err;
    }
  };

  return { compound, isPending };
}
