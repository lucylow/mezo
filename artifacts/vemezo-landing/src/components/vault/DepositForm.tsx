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
import { InfoIcon } from "lucide-react";

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

  const estimatedShares = selected ? (selected.amount * 0.95).toFixed(2) : "0.00";
  const performanceFee = 10;

  const handleDeposit = async () => {
    if (!selectedId || !deployed) return;
    try {
      const txHash = await deposit(BigInt(selectedId));
      setHash(txHash);
      setSelectedId("");
      onSuccess?.(txHash);
    } catch {
      // error toasted by useDeposit
    }
  };

  return (
    <div className="space-y-5">
      {/* NFT selector */}
      <div className="space-y-2">
        <Label>Select veMEZO NFT</Label>
        <Select
          value={selectedId}
          onValueChange={setSelectedId}
          disabled={!isConnected || nftsLoading}
        >
          <SelectTrigger className="w-full bg-background border-border">
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
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <InfoIcon className="h-3 w-3" />
          Depositing transfers the NFT to the vault contract.
        </p>
      </div>

      {/* Summary row */}
      <div className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Estimated Shares Received:</span>
          <span className="text-foreground font-mono">{estimatedShares}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Performance Fee:</span>
          <span className="text-foreground font-mono">{performanceFee}%</span>
        </div>
      </div>

      {/* Action button */}
      <Button
        className="w-full"
        onClick={handleDeposit}
        disabled={!isConnected || !selectedId || isPending || (!deployed && isConnected)}
      >
        {isPending
          ? "Depositing…"
          : !isConnected
          ? "Connect Wallet"
          : !deployed
          ? "Deposit NFT (preview)"
          : "Deposit NFT"}
      </Button>
    </div>
  );
}
