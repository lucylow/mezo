import { useState } from "react";
import { useWalletConnection } from "@/hooks/wallet/useWalletConnection";
import { shortenAddress } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Copy, ExternalLink, LogOut, ChevronDown, Check,
  AlertTriangle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_CHAIN } from "@/lib/wagmi/config";

export function AccountDisplay() {
  const { address, chain, disconnect, isCorrectNetwork, switchToDefaultChain, isSwitching } = useWalletConnection();
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const short = shortenAddress(address, 4);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = chain?.blockExplorers?.default?.url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition",
          isCorrectNetwork
            ? "bg-black/40 border-white/10 hover:bg-white/5"
            : "bg-red-500/10 border-red-500/30 text-red-400",
        )}>
          {!isCorrectNetwork && <AlertTriangle className="h-3.5 w-3.5" />}
          {isCorrectNetwork && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
          )}
          <span className="text-sm font-mono font-medium">{short}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-[#0a0b0d] border border-white/10 rounded-xl p-1 shadow-2xl">
        {/* Address + network */}
        <div className="px-3 py-3 border-b border-white/8 mb-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-mono font-medium">{short}</p>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isCorrectNetwork ? "bg-green-500" : "bg-red-500")} />
                <p className="text-xs text-muted-foreground">{chain?.name ?? "Unknown Network"}</p>
              </div>
            </div>
          </div>

          {!isCorrectNetwork && (
            <button
              onClick={switchToDefaultChain}
              disabled={isSwitching}
              className="w-full mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/15 transition"
            >
              {isSwitching ? "Switching…" : `Switch to ${DEFAULT_CHAIN.name}`}
            </button>
          )}
        </div>

        <DropdownMenuItem onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/5 focus:bg-white/5">
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>

        {explorerUrl && (
          <DropdownMenuItem asChild>
            <a
              href={`${explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1 bg-white/8" />

        <DropdownMenuItem
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer text-red-400 hover:bg-red-400/10 focus:bg-red-400/10"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
