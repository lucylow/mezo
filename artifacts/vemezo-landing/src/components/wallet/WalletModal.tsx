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

const KNOWN_WALLETS: Record<string, { label: string; icon: string; description: string; group?: string }> = {
  injected:       { label: "Browser Wallet",   icon: "🦊", description: "MetaMask, Rabby, Coinbase Wallet, etc.", group: "evm" },
  metaMask:       { label: "MetaMask",         icon: "🦊", description: "Connect to MetaMask",                   group: "evm" },
  coinbaseWallet: { label: "Coinbase Wallet",  icon: "🔵", description: "Coinbase Web3 Wallet",                  group: "evm" },
  safe:           { label: "Safe",             icon: "🔐", description: "Safe multisig wallet",                  group: "evm" },
  walletConnect:  { label: "WalletConnect",    icon: "🔗", description: "Connect via QR code",                   group: "evm" },
  xverse:         { label: "Xverse",           icon: "₿",  description: "Bitcoin wallet (Mezo Passport)",        group: "btc" },
  unisat:         { label: "UniSat",           icon: "🟡", description: "Bitcoin wallet (Mezo Passport)",        group: "btc" },
  okx:            { label: "OKX Wallet",       icon: "⬛", description: "Bitcoin + EVM wallet",                  group: "btc" },
};

function getWalletMeta(id: string, name: string) {
  const lower = id.toLowerCase();
  for (const [key, meta] of Object.entries(KNOWN_WALLETS)) {
    if (lower.includes(key.toLowerCase())) return meta;
  }
  const isBtcLike = lower.includes("bitcoin") || lower.includes("btc");
  return { label: name, icon: isBtcLike ? "₿" : "💼", description: `Connect with ${name}`, group: isBtcLike ? "btc" : "evm" };
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

  const btcConnectors = connectors.filter(c => getWalletMeta(c.id, c.name).group === "btc");
  const evmConnectors = connectors.filter(c => getWalletMeta(c.id, c.name).group !== "btc");

  const renderConnector = (c: (typeof connectors)[0]) => {
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
          <p className="text-xs text-muted-foreground mt-1 px-0">
            Powered by{" "}
            <span className="text-primary font-medium">Mezo Passport</span>
            {" "}— supports Bitcoin & EVM wallets
          </p>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {connectors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No wallets detected.</p>
              <a
                href="https://www.xverse.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
              >
                Install Xverse (Bitcoin) <ExternalLink className="h-3 w-3" />
              </a>
              <span className="mx-2 text-white/20">|</span>
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

          {btcConnectors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest px-1">
                ₿ Bitcoin Wallets
              </p>
              {btcConnectors.map(renderConnector)}
            </div>
          )}

          {evmConnectors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest px-1">
                ⬡ EVM Wallets
              </p>
              {evmConnectors.map(renderConnector)}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-1 border-t border-white/5">
          <p className="text-xs text-muted-foreground text-center">
            By connecting you agree to veMEZO's{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
