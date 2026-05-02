import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useDeposit } from "@/hooks/contracts/useVaultWrite";
import { useVeMEZONFTs } from "@/hooks/contracts/useVeMEZOData";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { CONTRACTS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";
import { InfoIcon, LayoutGrid, List, CheckSquare, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_NFTS = [
  { id: "1", tokenId: BigInt(1), value: BigInt("50000000000000000000000"), amount: 50000, unlockDate: "Jan 2026" },
  { id: "2", tokenId: BigInt(2), value: BigInt("25000000000000000000000"), amount: 25000, unlockDate: "Jun 2026" },
  { id: "3", tokenId: BigInt(3), value: BigInt("10000000000000000000000"), amount: 10000, unlockDate: "Dec 2026" },
];

interface DepositFormProps {
  onSuccess?: (hash: `0x${string}`) => void;
}

export function DepositForm({ onSuccess }: DepositFormProps) {
  const { address, isConnected } = useAccount();
  const deployed = Boolean(CONTRACTS.VAULT && CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000");

  const { nfts: walletNFTs, isLoading: nftsLoading } = useVeMEZONFTs(address);
  const { deposit, isPending } = useDeposit();

  const [selectedId, setSelectedId] = useState<string>("");
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  useTransactionToast({ hash });

  const availableNFTs = deployed && walletNFTs.length > 0
    ? walletNFTs.map((n) => ({
        id: n.tokenId.toString(),
        tokenId: n.tokenId,
        amount: Number(formatEther(n.value ?? BigInt(0))),
        unlockDate: n.lockEnd ? n.lockEnd.toISOString().slice(0, 10) : "",
      }))
    : MOCK_NFTS;

  const selected = availableNFTs.find((n) => n.id === selectedId);
  const batchList = availableNFTs.filter((n) => batchSelected.has(n.id));
  const batchTotal = batchList.reduce((a, n) => a + n.amount, 0);

  const estimatedShares = batchMode
    ? (batchTotal * 0.95).toFixed(2)
    : selected ? (selected.amount * 0.95).toFixed(2) : "0.00";

  const toggleBatch = (id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (batchSelected.size === availableNFTs.length) {
      setBatchSelected(new Set());
    } else {
      setBatchSelected(new Set(availableNFTs.map(n => n.id)));
    }
  };

  const handleDeposit = async () => {
    if (!deployed) return;
    try {
      if (batchMode) {
        for (const id of Array.from(batchSelected)) {
          const txHash = await deposit(BigInt(id));
          setHash(txHash);
          onSuccess?.(txHash);
        }
        setBatchSelected(new Set());
      } else {
        if (!selectedId) return;
        const txHash = await deposit(BigInt(selectedId));
        setHash(txHash);
        setSelectedId("");
        onSuccess?.(txHash);
      }
    } catch {
      // error toasted by useDeposit
    }
  };

  const canDeposit = deployed && isConnected && !isPending &&
    (batchMode ? batchSelected.size > 0 : !!selectedId);

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <Label>Select veMEZO NFT</Label>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => { setBatchMode(false); setBatchSelected(new Set()); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition",
              !batchMode ? "bg-primary text-black font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-3 w-3" />
            Single
          </button>
          <button
            onClick={() => { setBatchMode(true); setSelectedId(""); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition",
              batchMode ? "bg-primary text-black font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3 w-3" />
            Batch
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!batchMode ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={!isConnected || nftsLoading}
            >
              <SelectTrigger className="w-full bg-background border-border h-12">
                <SelectValue
                  placeholder={
                    !isConnected
                      ? "Connect wallet to view NFTs"
                      : nftsLoading
                      ? "Loading NFTs…"
                      : availableNFTs.length === 0
                      ? "No NFTs available"
                      : "Select NFT to deposit"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableNFTs.map((nft) => (
                  <SelectItem key={nft.id} value={nft.id}>
                    NFT #{nft.id} — {nft.amount.toLocaleString()} MEZO (unlocks {nft.unlockDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        ) : (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            {/* Select all */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <button
                onClick={selectAll}
                className="flex items-center gap-1.5 hover:text-foreground transition"
              >
                {batchSelected.size === availableNFTs.length
                  ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                  : <Square className="h-3.5 w-3.5" />
                }
                {batchSelected.size === availableNFTs.length ? "Deselect all" : "Select all"}
              </button>
              {batchSelected.size > 0 && (
                <Badge variant="default" size="sm">{batchSelected.size} selected</Badge>
              )}
            </div>

            {/* NFT card grid */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {availableNFTs.map((nft) => {
                const isSelected = batchSelected.has(nft.id);
                return (
                  <button
                    key={nft.id}
                    onClick={() => toggleBatch(nft.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border text-left transition",
                      isSelected
                        ? "border-primary/40 bg-primary/8"
                        : "border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border transition",
                        isSelected ? "bg-primary border-primary" : "border-white/20"
                      )}>
                        {isSelected && <CheckSquare className="h-3 w-3 text-black" />}
                      </div>
                      <div>
                        <p className="text-sm font-mono font-semibold text-primary">NFT #{nft.id}</p>
                        <p className="text-xs text-muted-foreground">Unlocks {nft.unlockDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{nft.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">MEZO</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {batchSelected.size > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                <span>Total value</span>
                <span className="font-mono font-semibold text-foreground">{batchTotal.toLocaleString()} MEZO</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <InfoIcon className="h-3 w-3" />
        Depositing transfers the NFT to the vault contract. A 7-day withdrawal lock applies.
      </p>

      {/* Summary row */}
      <div className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Estimated Shares Received:</span>
          <span className="text-foreground font-mono">{estimatedShares}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Performance Fee:</span>
          <span className="text-foreground font-mono">10%</span>
        </div>
      </div>

      {/* Action button */}
      <Button
        className="w-full h-12 text-base"
        onClick={handleDeposit}
        disabled={!canDeposit}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Depositing…</>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : batchMode ? (
          batchSelected.size > 0
            ? `Deposit ${batchSelected.size} NFT${batchSelected.size > 1 ? "s" : ""}`
            : "Select NFTs to deposit"
        ) : !deployed ? (
          "Deposit NFT (preview)"
        ) : (
          "Deposit NFT"
        )}
      </Button>
    </div>
  );
}
