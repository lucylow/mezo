import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Vote, Clock, Users, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: "active" | "passed" | "failed" | "pending";
  votesFor: number;
  votesAgainst: number;
  daysLeft: number;
  author: string;
}

const PROPOSALS: Proposal[] = [
  {
    id: "VIP-1",
    title: "Increase MEZO Emissions to veMEZO Holders",
    description: "Proposal to increase weekly MEZO emissions to veMEZO lockers from 0.5% to 0.75% of total supply to incentivise long-term locking.",
    status: "active",
    votesFor: 1250000,
    votesAgainst: 450000,
    daysLeft: 3,
    author: "0x1234...5678",
  },
  {
    id: "VIP-2",
    title: "Reduce Performance Fee to 8%",
    description: "Proposal to reduce the Auto-Compounder performance fee from 10% to 8%, passing savings directly to depositors.",
    status: "active",
    votesFor: 890000,
    votesAgainst: 760000,
    daysLeft: 5,
    author: "0x9876...5432",
  },
  {
    id: "VIP-3",
    title: "Add MUSD/USDC Gauge on Aerodrome",
    description: "Create a new gauge for MUSD/USDC liquidity on Aerodrome to attract more stablecoin liquidity to the Mezo ecosystem.",
    status: "passed",
    votesFor: 2100000,
    votesAgainst: 120000,
    daysLeft: 0,
    author: "0xabcd...efgh",
  },
  {
    id: "VIP-4",
    title: "Whitelist New Vault Strategy",
    description: "Whitelist a new auto-compounding strategy for the MEZO-BTC liquidity pool.",
    status: "failed",
    votesFor: 320000,
    votesAgainst: 980000,
    daysLeft: 0,
    author: "0xfeed...cafe",
  },
];

const STATUS_STYLES: Record<string, string> = {
  active:  "text-primary bg-primary/10 border-primary/30",
  passed:  "text-green-400 bg-green-400/10 border-green-400/30",
  failed:  "text-red-400 bg-red-400/10 border-red-400/30",
  pending: "text-muted-foreground bg-white/5 border-white/10",
};

const TABS = ["active", "passed", "failed", "all"] as const;

export default function Governance() {
  const { isConnected } = useWallet();
  const [tab, setTab] = useState<typeof TABS[number]>("active");
  const [voted, setVoted] = useState<Record<string, "for" | "against">>({});

  const userVotingPower = isConnected ? 125000 : 0;
  const totalVotingPower = 5200000;

  const filtered = PROPOSALS.filter(p => tab === "all" || p.status === tab);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Governance</h1>
        <p className="text-muted-foreground">Participate in protocol decisions using your veMEZO voting power.</p>
      </div>

      {/* Voting power */}
      <Card className="bg-black/40 border-white/8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/15 rounded-2xl">
                <Vote className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Your Voting Power</p>
                <p className="text-3xl font-bold">
                  {isConnected ? formatNumber(userVotingPower) : "—"} <span className="text-lg font-normal text-muted-foreground">veMEZO</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isConnected
                    ? `${((userVotingPower / totalVotingPower) * 100).toFixed(2)}% of total · ${formatNumber(totalVotingPower)} total supply`
                    : "Connect wallet to view voting power"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/10 bg-transparent">Delegate</Button>
              <Button>Lock More MEZO <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proposals</CardTitle>
          <Button size="sm" variant="outline" className="border-white/10">Create Proposal</Button>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm capitalize transition",
                  tab === t ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 && (
              <p className="text-muted-foreground text-center py-10">No proposals found.</p>
            )}
            {filtered.map(p => {
              const total = p.votesFor + p.votesAgainst;
              const forPct = total ? (p.votesFor / total) * 100 : 0;
              const myVote = voted[p.id];

              return (
                <div key={p.id} className="p-5 rounded-xl border border-white/8 hover:border-primary/20 transition bg-white/2">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-primary">{p.id}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", STATUS_STYLES[p.status])}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base">{p.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="text-green-400">For: {formatNumber(p.votesFor)} veMEZO ({forPct.toFixed(1)}%)</span>
                      <span className="text-red-400">Against: {formatNumber(p.votesAgainst)} veMEZO ({(100 - forPct).toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-red-400/20 overflow-hidden">
                      <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${forPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="h-3 w-3" />{p.author}</span>
                      {p.status === "active" && (
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{p.daysLeft}d remaining</span>
                      )}
                    </div>
                    {p.status === "active" && userVotingPower > 0 && (
                      <div className="flex gap-2">
                        {myVote ? (
                          <span className={cn("flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg", myVote === "for" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10")}>
                            {myVote === "for" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            Voted {myVote === "for" ? "For" : "Against"}
                          </span>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="border-green-400/30 text-green-400 hover:bg-green-400/10" onClick={() => setVoted(v => ({ ...v, [p.id]: "for" }))}>
                              Vote For
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-400/30 text-red-400 hover:bg-red-400/10" onClick={() => setVoted(v => ({ ...v, [p.id]: "against" }))}>
                              Vote Against
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
