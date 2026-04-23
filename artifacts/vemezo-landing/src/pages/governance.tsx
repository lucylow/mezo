import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useGovernance } from "@/hooks/useGovernance";
import { Vote, Clock, Users, ChevronRight, CheckCircle2, XCircle, Coins, Shield, Zap } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface Proposal {
  id: string;
  proposalId: bigint;
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
    proposalId: 1n,
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
    proposalId: 2n,
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
    proposalId: 3n,
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
    proposalId: 4n,
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
  const {
    userVotingPower,
    totalSupply,
    votingPowerPct,
    pendingRewards,
    claimRewards,
    isClaimingRewards,
    castVote,
    isCastingVote,
    isGovernanceDeployed,
  } = useGovernance();

  const [tab, setTab] = useState<typeof TABS[number]>("active");
  const [voted, setVoted] = useState<Record<string, "for" | "against">>({});

  const displayVotingPower = isConnected ? userVotingPower : 0;
  const displayTotalPower  = totalSupply > 0 ? totalSupply : 5200000;

  const filtered = PROPOSALS.filter(p => tab === "all" || p.status === tab);

  function handleVote(proposalId: string, proposalIdBigInt: bigint, side: "for" | "against") {
    if (isGovernanceDeployed) {
      castVote(proposalIdBigInt, side === "for" ? 1 : 0);
    }
    setVoted(v => ({ ...v, [proposalId]: side }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Governance</h1>
        <p className="text-muted-foreground">Participate in protocol decisions using your veMEZO voting power.</p>
      </div>

      {/* Decentralization status banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center gap-4"
      >
        <Shield className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">Progressive Decentralization Active</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Parameter changes require a governance vote + 2-day timelock.
            50% of performance fees are distributed proportionally to vveMEZO holders.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
            <Zap className="h-3 w-3" /> Gelato keeper active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Shield className="h-3 w-3" /> Timelock enabled
          </span>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-white/8">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/15 rounded-xl shrink-0">
              <Vote className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Your Voting Power</p>
              <p className="text-2xl font-bold">
                {isConnected ? formatNumber(displayVotingPower) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected ? `${votingPowerPct}% of total` : "Connect wallet"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/15 rounded-xl shrink-0">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Total vveMEZO</p>
              <p className="text-2xl font-bold">{formatNumber(displayTotalPower)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total voting supply</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-500/15 rounded-xl shrink-0">
              <Coins className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Pending Fee Rewards</p>
              <p className="text-2xl font-bold">
                {isConnected ? formatNumber(pendingRewards) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">MUSD claimable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voting power + actions */}
      <Card className="bg-black/40 border-white/8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Your Voting Power</p>
              <p className="text-3xl font-bold">
                {isConnected ? formatNumber(displayVotingPower) : "—"}{" "}
                <span className="text-lg font-normal text-muted-foreground">vveMEZO</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isConnected
                  ? `${votingPowerPct}% of total · ${formatNumber(displayTotalPower)} total`
                  : "Connect wallet to view voting power"}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" className="border-white/10 bg-transparent">
                Delegate
              </Button>
              <Button>
                Lock More MEZO <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee rewards claim */}
      <AnimatePresence>
        {isConnected && pendingRewards > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-black/40 border-green-400/20">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-400/10 rounded-xl shrink-0">
                    <Coins className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-400">
                      {formatNumber(pendingRewards, 4)} MUSD Available
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your share of protocol performance fees. 50% of all fees are distributed proportionally to vveMEZO holders.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={claimRewards}
                  disabled={isClaimingRewards}
                  className="bg-green-500 hover:bg-green-600 text-white shrink-0"
                >
                  {isClaimingRewards ? "Claiming…" : `Claim ${formatNumber(pendingRewards)} MUSD`}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proposals */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proposals</CardTitle>
          <Button size="sm" variant="outline" className="border-white/10">
            Create Proposal
          </Button>
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
              const total  = p.votesFor + p.votesAgainst;
              const forPct = total ? (p.votesFor / total) * 100 : 0;
              const myVote = voted[p.id];

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl border border-white/8 hover:border-primary/20 transition bg-white/2"
                >
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
                      <span className="text-green-400">For: {formatNumber(p.votesFor)} vveMEZO ({forPct.toFixed(1)}%)</span>
                      <span className="text-red-400">Against: {formatNumber(p.votesAgainst)} vveMEZO ({(100 - forPct).toFixed(1)}%)</span>
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
                    {p.status === "active" && displayVotingPower > 0 && (
                      <div className="flex gap-2">
                        {myVote ? (
                          <span className={cn(
                            "flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg",
                            myVote === "for" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                          )}>
                            {myVote === "for" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            Voted {myVote === "for" ? "For" : "Against"}
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCastingVote}
                              className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                              onClick={() => handleVote(p.id, p.proposalId, "for")}
                            >
                              Vote For
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCastingVote}
                              className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                              onClick={() => handleVote(p.id, p.proposalId, "against")}
                            >
                              Vote Against
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Decentralization roadmap */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle>Decentralization Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                phase: "Phase 1",
                title: "Gelato Keeper",
                desc: "Single-node keeper replaced with Gelato Network's decentralized executor network.",
                done: true,
              },
              {
                phase: "Phase 2",
                title: "Timelock Governance",
                desc: "All vault parameter changes require a governance vote + 2-day timelock delay.",
                done: true,
              },
              {
                phase: "Phase 3",
                title: "Fee Distribution",
                desc: "50% of performance fees distributed proportionally to vveMEZO holders. Claimable any time.",
                done: true,
              },
              {
                phase: "Phase 4",
                title: "Multi-Sig Emergency",
                desc: "Emergency controls require 3-of-5 guardian approvals, eliminating single-owner risk.",
                done: true,
              },
              {
                phase: "Phase 5",
                title: "Subgraph Transparency",
                desc: "Full on-chain indexing of governance votes, fee distributions, and timelock operations.",
                done: true,
              },
              {
                phase: "Phase 6",
                title: "Proxy Upgradeability",
                desc: "Governance-controlled upgrade proxy pattern — future enhancements require on-chain votes.",
                done: false,
              },
            ].map(({ phase, title, desc, done }) => (
              <div
                key={phase}
                className={cn(
                  "p-4 rounded-xl border transition",
                  done
                    ? "border-green-400/20 bg-green-400/5"
                    : "border-white/8 bg-white/2 opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{phase}</span>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
