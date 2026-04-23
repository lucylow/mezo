import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useWithdraw } from "@/hooks/contracts/useVaultWrite";
import { useUserPosition } from "@/hooks/useUserPosition";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { CONTRACTS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface WithdrawFormProps {
  onSuccess?: (hash: `0x${string}`) => void;
}

export function WithdrawForm({ onSuccess }: WithdrawFormProps) {
  const { address, isConnected } = useAccount();
  const deployed = Boolean(CONTRACTS.VAULT && CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000");

  const position = useUserPosition();
  const { withdraw, withdrawByShares, isPending } = useWithdraw();

  const [sharesInput, setSharesInput] = useState<string>("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  useTransactionToast({ hash });

  const estimatedReceive = sharesInput
    ? (Number(sharesInput) * 1.05).toFixed(2)
    : "0.00";

  const handleWithdrawByShares = async () => {
    if (!sharesInput || !deployed) return;
    try {
      const txHash = await withdrawByShares(parseEther(sharesInput));
      setHash(txHash);
      setSharesInput("");
      onSuccess?.(txHash);
    } catch {
      // error toasted by useWithdraw
    }
  };

  const handleWithdrawNFT = async (tokenId: string) => {
    try {
      const txHash = await withdraw(BigInt(tokenId));
      setHash(txHash);
      onSuccess?.(txHash);
    } catch {
      // error toasted by useWithdraw
    }
  };

  return (
    <div className="space-y-5">
      {/* Shares input */}
      <div className="space-y-2">
        <Label>vveMEZO Shares to Redeem</Label>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={sharesInput}
            onChange={(e) => setSharesInput(e.target.value)}
            className="bg-background border-border pr-20"
            min="0"
            disabled={!isConnected}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 font-semibold"
            onClick={() => {
              if (position?.shares) setSharesInput(position.shares.toString());
            }}
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Available:{" "}
          <span className="text-foreground font-mono">
            {isConnected ? (position?.shares?.toLocaleString() ?? "0") : "—"} vveMEZO
          </span>
        </p>
      </div>

      {/* Summary row */}
      <div className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Estimated MEZO Received:</span>
          <span className="text-foreground font-mono">{estimatedReceive}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Exchange Rate:</span>
          <span className="text-foreground font-mono">1 vveMEZO ≈ 1.05 MEZO</span>
        </div>
      </div>

      {/* Redeem by shares */}
      <Button
        className="w-full"
        onClick={handleWithdrawByShares}
        disabled={!isConnected || !sharesInput || isPending || (!deployed && isConnected)}
      >
        {isPending
          ? "Withdrawing…"
          : !isConnected
          ? "Connect Wallet"
          : !deployed
          ? "Withdraw (preview)"
          : "Redeem Shares"}
      </Button>

      {/* Per-NFT withdrawal */}
      {isConnected && position?.nftsLocked && position.nftsLocked.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Or withdraw a specific NFT</Label>
            <div className="space-y-2">
              {position.nftsLocked.map((nft) => (
                <div
                  key={nft.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/30 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    NFT #{nft.id} — {nft.amount.toLocaleString()} MEZO
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWithdrawNFT(nft.id)}
                    disabled={isPending}
                    className="h-7 px-3 text-xs"
                  >
                    Withdraw
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
