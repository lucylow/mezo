import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Triggers compoundAll() via the keeper API endpoint.
 * The server authenticates with KEEPER_API_SECRET and calls the vault
 * from the keeper's dedicated wallet.
 *
 * Usage:
 *   const { triggerCompound, isPending } = useTriggerCompound();
 *   <Button onClick={triggerCompound}>Force Compound</Button>
 */
export function useTriggerCompound() {
  const mutation = useMutation({
    mutationFn: async () => {
      const res  = await fetch("/api/keeper/compound", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Keeper error");
      return data as { success: boolean; txHash?: string; reason?: string };
    },
    onSuccess(data) {
      if (data.success && data.txHash) {
        toast.success(`Compounding triggered! Tx: ${data.txHash.slice(0, 10)}…`);
      } else {
        toast.info(
          data.reason === "not-profitable"
            ? "Compounding not yet profitable — no rewards to claim."
            : `Keeper: ${data.reason ?? "unknown result"}`,
        );
      }
    },
    onError(err: Error) {
      toast.error(`Keeper error: ${err.message}`);
    },
  });

  return {
    triggerCompound: mutation.mutate,
    isPending:       mutation.isPending,
    lastResult:      mutation.data,
  };
}
