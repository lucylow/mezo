import { useWatchContractEvent } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, VeMEZOVaultABI, isContractDeployed } from "@/lib/contracts";
import { useTransactionStore } from "@/store/transactionStore";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Subscribes to Deposited / Withdrawn / Compounded events from the vault.
 * Auto-invalidates React Query caches so all hooks reflect fresh data.
 * No-op when the contract is not yet deployed.
 */
export function useVaultEvents() {
  const deployed = isContractDeployed();
  const addTx    = useTransactionStore((s) => s.addTransaction);
  const updateTx = useTransactionStore((s) => s.updateTransaction);
  const qc       = useQueryClient();

  useWatchContractEvent({
    address: CONTRACTS.VAULT,
    abi:     VeMEZOVaultABI,
    eventName: "Deposited",
    enabled: deployed,
    onLogs(logs) {
      logs.forEach((log) => {
        const { value } = log.args as { value?: bigint };
        addTx({
          hash:      log.transactionHash ?? "",
          type:      "deposit",
          status:    "confirmed",
          timestamp: Date.now(),
          amount:    value ? formatEther(value) : undefined,
        });
      });
      qc.invalidateQueries({ queryKey: ["api"] });
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.VAULT,
    abi:     VeMEZOVaultABI,
    eventName: "Withdrawn",
    enabled: deployed,
    onLogs(logs) {
      logs.forEach((log) => {
        const { value } = log.args as { value?: bigint };
        addTx({
          hash:      log.transactionHash ?? "",
          type:      "withdraw",
          status:    "confirmed",
          timestamp: Date.now(),
          amount:    value ? formatEther(value) : undefined,
        });
      });
      qc.invalidateQueries({ queryKey: ["api"] });
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.VAULT,
    abi:     VeMEZOVaultABI,
    eventName: "Compounded",
    enabled: deployed,
    onLogs(logs) {
      logs.forEach((log) => {
        const { amountCompounded } = log.args as { amountCompounded?: bigint };
        addTx({
          hash:      log.transactionHash ?? "",
          type:      "compound",
          status:    "confirmed",
          timestamp: Date.now(),
          amount:    amountCompounded ? formatEther(amountCompounded) : undefined,
        });
      });
      qc.invalidateQueries({ queryKey: ["api"] });
    },
  });
}
