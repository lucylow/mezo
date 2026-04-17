import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useWalletConnection } from "@/hooks/wallet/useWalletConnection";
import { Wallet, ChevronRight, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

const KNOWN_WALLETS: Record<string, { label: string; icon: string; description: string }> = {
  injected:  { label: "Browser Wallet",   icon: "🦊", description: "MetaMask, Rabby, Coinbase Wallet, etc." },
  metaMask:  { label: "MetaMask",         icon: "🦊", description: "Connect to MetaMask" },
  coinbaseWallet: { label: "Coinbase Wallet", icon: "🔵", description: "Coinbase Web3 Wallet" },
  safe:      { label: "Safe",             icon: "🔐", description: "Safe multisig wallet" },
};

function getWalletMeta(id: string, name: string) {
  return KNOWN_WALLETS[id] ?? { label: name, icon: "💼", description: `Connect with ${name}` };
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { connectors, connect, isConnected } = useWalletConnection();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isConnected && open) {
    onClose();
    return null;
  }

  const handleConnect = async (connectorId: string) => {
    setLoadingId(connectorId);
    setError(null);
    try {
      await connect(connectorId);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (!msg.toLowerCase().includes("rejected")) {
        setError(msg);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#0a0b0d] border border-white/10 rounded-2xl max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/8">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-primary/15 rounded-xl">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {connectors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No wallets detected.</p>
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
              >
                Install MetaMask <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {connectors.map(c => {
            const meta = getWalletMeta(c.id, c.name);
            const loading = loadingId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleConnect(c.id)}
                disabled={!!loadingId}
                className={cn(
                  "flex items-center w-full p-4 rounded-xl border border-white/8 bg-white/2 hover:bg-white/6 hover:border-primary/30 transition-all text-left",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-xl mr-4 shrink-0">
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-5 pt-1">
          <p className="text-xs text-muted-foreground text-center">
            By connecting you agree to veMEZO's{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
