import { useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useTransactionStore } from "@/store/transactionStore";

interface Options {
  hash?: `0x${string}`;
  onSuccess?: () => void;
  onError?: () => void;
}

/** Monitors a transaction hash and fires sonner toasts + updates the store. */
export function useTransactionToast({ hash, onSuccess, onError }: Options) {
  const update = useTransactionStore((s) => s.updateTransaction);

  const { isLoading, isSuccess, isError, error } =
    useWaitForTransactionReceipt({ hash, query: { enabled: !!hash } });

  useEffect(() => {
    if (!hash) return;

    if (isSuccess) {
      toast.success("Transaction confirmed!", { id: hash });
      update(hash, { status: "confirmed" });
      onSuccess?.();
    } else if (isError) {
      const msg = error?.message ?? "Transaction failed";
      toast.error(msg, { id: hash });
      update(hash, { status: "failed" });
      onError?.();
    }
  }, [isSuccess, isError, hash, error, onSuccess, onError, update]);

  return { isLoading, isSuccess, isError };
}
