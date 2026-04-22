import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TxType   = "deposit" | "withdraw" | "compound";
export type TxStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  hash:      string;
  type:      TxType;
  status:    TxStatus;
  timestamp: number;
  amount?:   string;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction:    (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  clearHistory:      () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],

      addTransaction: (tx) =>
        set((s) => ({
          transactions: [tx, ...s.transactions].slice(0, 50),
        })),

      updateTransaction: (hash, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.hash === hash ? { ...t, ...updates } : t,
          ),
        })),

      clearHistory: () => set({ transactions: [] }),
    }),
    { name: "vemezo-transactions" },
  ),
);
