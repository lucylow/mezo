import { useEffect, useRef } from "react";
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

  // Keep stable refs to callbacks so the effect deps list stays clean
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef   = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current   = onError;

  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  useEffect(() => {
    if (!hash) return;

    if (isSuccess) {
      toast.success("Transaction confirmed!", { id: hash });
      update(hash, { status: "confirmed" });
      onSuccessRef.current?.();
    } else if (isError) {
      const msg =
        (error as any)?.shortMessage ??
        error?.message ??
        "Transaction failed";
      toast.error(msg, { id: hash });
      update(hash, { status: "failed" });
      onErrorRef.current?.();
    }
  }, [isSuccess, isError, hash, error, update]);

  return { isLoading, isSuccess, isError };
}
