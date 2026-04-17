import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, RefreshCw, Search, ExternalLink, Wallet } from "lucide-react";
import { cn, formatDate, formatNumber, shortenAddress } from "@/lib/utils";

type TxType = "deposit" | "withdraw" | "compound" | "swap" | "claim";

interface Transaction {
  hash: string;
  type: TxType;
  amount: number;
  token: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
}

const TRANSACTIONS: Transaction[] = [
  { hash: "0x4a2f1...", type: "deposit",  amount: 1200,  token: "MEZO",    timestamp: new Date(Date.now() - 600_000),    status: "completed" },
  { hash: "0x1c...8a4", type: "compound", amount: 45,    token: "MEZO",    timestamp: new Date(Date.now() - 3_600_000),  status: "completed" },
  { hash: "0x9b...1e3", type: "withdraw", amount: 500,   token: "vveMEZO", timestamp: new Date(Date.now() - 7_200_000),  status: "completed" },
  { hash: "0x7d...4c2", type: "deposit",  amount: 800,   token: "MEZO",    timestamp: new Date(Date.now() - 43_200_000), status: "completed" },
  { hash: "0xfe...cafe", type: "swap",    amount: 100,   token: "MUSD",    timestamp: new Date(Date.now() - 86_400_000), status: "completed" },
  { hash: "0xde...ad",  type: "claim",   amount: 25.8,  token: "MEZO",    timestamp: new Date(Date.now() - 172_800_000),status: "completed" },
  { hash: "0xba...be",  type: "deposit", amount: 3450,  token: "MEZO",    timestamp: new Date(Date.now() - 259_200_000),status: "completed" },
  { hash: "0xca...fe",  type: "compound",amount: 38.4,  token: "MEZO",    timestamp: new Date(Date.now() - 345_600_000),status: "completed" },
];

const TYPE_META: Record<TxType, { icon: React.ElementType; color: string; label: string; sign: string }> = {
  deposit:  { icon: ArrowDown,  color: "text-green-400 bg-green-400/10",  label: "Deposit",  sign: "+" },
  withdraw: { icon: ArrowUp,    color: "text-red-400 bg-red-400/10",      label: "Withdraw", sign: "-" },
  compound: { icon: RefreshCw,  color: "text-primary bg-primary/10",      label: "Compound", sign: "+" },
  swap:     { icon: RefreshCw,  color: "text-blue-400 bg-blue-400/10",    label: "Swap",     sign: "~" },
  claim:    { icon: ArrowDown,  color: "text-yellow-400 bg-yellow-400/10",label: "Claim",    sign: "+" },
};

const FILTER_OPTS = ["all", "deposit", "withdraw", "compound", "swap", "claim"] as const;

export default function History() {
  const { isConnected, connect } = useWallet();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
          <p className="text-muted-foreground">View all your on-chain activity.</p>
        </div>
        <Card className="py-16 text-center bg-black/40 border-white/8">
          <div className="flex flex-col items-center gap-4">
            <div className="p-5 rounded-full bg-primary/10">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-semibold">Connect your wallet</p>
            <p className="text-muted-foreground text-sm">Connect to view your transaction history.</p>
            <Button onClick={connect} className="mt-2">Connect Wallet</Button>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = TRANSACTIONS.filter(tx => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (search && !tx.hash.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
        <p className="text-muted-foreground">All your on-chain activity in one place.</p>
      </div>

      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">All Transactions</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search hash..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm w-44 focus:outline-none focus:border-primary/40"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm capitalize focus:outline-none focus:border-primary/40"
              >
                {FILTER_OPTS.map(o => (
                  <option key={o} value={o} className="bg-[#0a0b0d]">{o === "all" ? "All Types" : o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No transactions found.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(tx => {
                const meta = TYPE_META[tx.type];
                const Icon = meta.icon;
                return (
                  <div key={tx.hash} className="flex items-center justify-between py-3.5 hover:bg-white/2 -mx-2 px-2 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        <span className={meta.sign === "-" ? "text-red-400" : meta.sign === "+" ? "text-green-400" : ""}>
                          {meta.sign}{formatNumber(tx.amount)}
                        </span>
                        {" "}<span className="text-muted-foreground">{tx.token}</span>
                      </p>
                      <a
                        href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center justify-end gap-1 mt-0.5"
                      >
                        {shortenAddress(tx.hash)} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/8 text-center">
            <p className="text-xs text-muted-foreground">Showing {filtered.length} of {TRANSACTIONS.length} transactions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
