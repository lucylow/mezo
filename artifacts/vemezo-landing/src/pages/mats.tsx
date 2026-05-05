import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  useMatsBalance,
  MATS_PER_DEPOSIT, MATS_PER_COMPOUND, MATS_PER_EXTENSION, MATS_PER_SHARE_DAY,
  SEASON1_MATS_RATE, SEASON2_MATS_RATE,
} from "@/hooks/useMatsBalance";
import { useWallet } from "@/hooks/useWallet";
import { ReferralWidget } from "@/components/referralui/ReferralWidget";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  Sparkles, ArrowDownToLine, RefreshCw, Lock, Clock,
  Crown, Users, Coins, TrendingUp, Copy, Check, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useState as useLocalState } from "react";

// ── Protocol-level mock data (global, not per-user) ──────────────────────────

const PROTOCOL_MATS_TOTAL   = 1_240_500;
const PROTOCOL_MATS_DAILY   = 24_000;
const PROTOCOL_DEPOSITORS   = 847;

const MATS_LEADERBOARD = [
  { rank: 1,  address: "0x1234...5678", mats: 125_680, vaultShare: "12.4%", bonus: "+25% S2",  isUser: false },
  { rank: 2,  address: "0xabcd...efgh", mats:  98_750, vaultShare:  "8.2%", bonus: "+25% S2",  isUser: false },
  { rank: 3,  address: "0x9876...5432", mats:  76_420, vaultShare:  "5.1%", bonus: "veMEZO 2×", isUser: false },
  { rank: 4,  address: "0xfedc...ba98", mats:  62_100, vaultShare:  "4.3%", bonus: "",          isUser: false },
  { rank: 5,  address: "0x2468...1357", mats:  54_880, vaultShare:  "3.8%", bonus: "+25% S2",  isUser: false },
  { rank: 6,  address: "0xdead...beef", mats:  41_200, vaultShare:  "2.9%", bonus: "veMEZO 2×", isUser: false },
  { rank: 7,  address: "0xcafe...babe", mats:  34_060, vaultShare:  "2.1%", bonus: "",          isUser: false },
  { rank: 12, address: "0xYOUR...WALLET", mats: 18_240, vaultShare: "1.2%", bonus: "+25% S2",  isUser: true  },
];

// ── Earning mechanism rows ────────────────────────────────────────────────────

const MECHANISMS = [
  { icon: ArrowDownToLine, label: "NFT Deposit",      matsEach: MATS_PER_DEPOSIT,   unit: "per NFT",        color: "text-primary",    bg: "bg-primary/10"    },
  { icon: RefreshCw,       label: "Auto-Compound",    matsEach: MATS_PER_COMPOUND,  unit: "per epoch",      color: "text-green-400",  bg: "bg-green-500/10"  },
  { icon: Lock,            label: "Lock Extension",   matsEach: MATS_PER_EXTENSION, unit: "per extension",  color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { icon: Clock,           label: "Share-Day Held",   matsEach: MATS_PER_SHARE_DAY, unit: "per share/day",  color: "text-purple-400", bg: "bg-purple-500/10" },
];

// ── Rank Badge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span>🥇</span>;
  if (rank === 2) return <span>🥈</span>;
  if (rank === 3) return <span>🥉</span>;
  return <span className="font-mono text-muted-foreground text-sm">#{rank}</span>;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function Mats() {
  const { isConnected } = useWallet();
  const { address }     = useAccount();
  const { data: matsData, isLoading } = useMatsBalance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-2xl font-bold tracking-tight">Mats Dashboard</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Magic satoshis — Mezo's activity points that determine MEZO airdrop allocation.
          </p>
        </div>
        <Badge variant="info" dot dotColor="bg-purple-400" className="shrink-0">
          Season 2 · {SEASON2_MATS_RATE} mats / MEZO
        </Badge>
      </div>

      {/* Protocol stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          {
            label: "Protocol Mats Distributed",
            value: PROTOCOL_MATS_TOTAL.toLocaleString(),
            icon: Sparkles,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            sub: "Total all-time",
          },
          {
            label: "Daily Mats Rate",
            value: `~${PROTOCOL_MATS_DAILY.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-400",
            bg: "bg-green-500/10",
            sub: "Vault-wide per day",
          },
          {
            label: "Vault Depositors",
            value: PROTOCOL_DEPOSITORS.toLocaleString(),
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            sub: "Earning Mats right now",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={staggerItem}
              className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <div className={cn("p-1.5 rounded-lg", s.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", s.color)} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold font-mono mb-1", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Your Mats — personal section */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Your Mats
            </CardTitle>
            {isConnected && (
              <Badge variant="success" dot dotColor="bg-green-400">Live</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-purple-400" />
              </div>
              <p className="font-semibold mb-1">Connect wallet to view your Mats</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your Mats balance is computed from your vault activity — deposits, compounds, lock extensions, and share-day holding.
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Computing your Mats…</div>
          ) : matsData ? (
            <div className="space-y-6">
              {/* Total + estimated */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 rounded-xl bg-purple-500/10 border border-purple-500/20 p-5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Mats</p>
                  <p className="text-4xl font-bold font-mono text-purple-300">{matsData.totalMats.toLocaleString()}</p>
                  {matsData.multiSeasonBonus && (
                    <p className="text-xs text-purple-400 mt-2 font-mono">incl. +25% multi-season bonus</p>
                  )}
                </div>
                <div className="rounded-xl bg-white/5 border border-white/8 p-5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Est. MEZO Allocation</p>
                  <p className="text-3xl font-bold font-mono text-foreground">{matsData.estimatedMEZO.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">at {SEASON2_MATS_RATE} mats/MEZO</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/8 p-5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Referral Mats</p>
                  <p className="text-3xl font-bold font-mono text-green-400">{matsData.referralMats.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">{matsData.referrals} referrals · 5% lifetime</p>
                </div>
              </div>

              {/* Activity breakdown */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Activity Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MECHANISMS.map((m) => {
                    const count =
                      m.label === "NFT Deposit"     ? matsData.activity.deposits   :
                      m.label === "Auto-Compound"   ? matsData.activity.compounds  :
                      m.label === "Lock Extension"  ? matsData.activity.extensions :
                      matsData.activity.shareDays;
                    const earned = count * m.matsEach;
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className={cn("rounded-xl border p-4 text-center", m.bg, "border-white/8")}>
                        <div className={cn("flex justify-center mb-2")}>
                          <Icon className={cn("h-5 w-5", m.color)} />
                        </div>
                        <p className="text-lg font-bold font-mono">{count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                        <p className={cn("text-xs font-semibold font-mono", m.color)}>
                          +{earned.toLocaleString()} mats
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Earning mechanisms reference */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>How the Vault Generates Mats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Vault Action", "Trigger", "Mats Awarded", "Automated?"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider pb-3 pr-6 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { action: "NFT Deposit",      trigger: "On deposit",       mats: `${MATS_PER_DEPOSIT} per NFT`,      auto: true  },
                  { action: "Auto-Compound",     trigger: "Every Thu epoch",  mats: `${MATS_PER_COMPOUND} per epoch`,   auto: true  },
                  { action: "Lock Extension",    trigger: "Every Thu epoch",  mats: `${MATS_PER_EXTENSION} per ext.`,   auto: true  },
                  { action: "Share-Day Holding", trigger: "Daily accrual",    mats: `${MATS_PER_SHARE_DAY} per share/day`, auto: true },
                  { action: "Referral Bonus",    trigger: "On referred deposit", mats: "5% of referred Mats",          auto: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-6 font-medium">{row.action}</td>
                    <td className="py-3 pr-6 text-muted-foreground font-mono text-xs">{row.trigger}</td>
                    <td className="py-3 pr-6 font-mono text-primary">{row.mats}</td>
                    <td className="py-3 pr-6">
                      <Badge variant={row.auto ? "success" : "muted"} size="sm">
                        {row.auto ? "✓ Auto" : "Manual"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Season comparison */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Mats Season Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/8 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Season 1</p>
                <Badge variant="muted" size="sm">Closed · Mar 2024 – May 2025</Badge>
              </div>
              <p className="text-3xl font-bold font-mono text-muted-foreground">{SEASON1_MATS_RATE}</p>
              <p className="text-sm text-muted-foreground mt-1">mats per MEZO</p>
              <p className="text-xs text-muted-foreground mt-3 font-mono leading-relaxed">
                Early adopter era — high Mats generation rewarded initial ecosystem builders.
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Season 2</p>
                <Badge variant="info" dot dotColor="bg-purple-400" size="sm">Live · May 2025 – Jan 2026</Badge>
              </div>
              <p className="text-3xl font-bold font-mono text-purple-300">{SEASON2_MATS_RATE}</p>
              <p className="text-sm text-muted-foreground mt-1">mats per MEZO</p>
              <p className="text-xs text-muted-foreground mt-3 font-mono leading-relaxed">
                Mainnet Mats are rewarded more favorably than testnet Mats. Scarcity is deliberate.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/15">
            <p className="text-sm font-medium text-green-400 mb-1">+25% Multi-Season Bonus</p>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Addresses that participated in both Season 1 and Season 2 automatically receive a 25% basic
              distribution bonus on their total Mats balance. The vault's continuous on-chain activity
              across both seasons maximizes eligibility for this bonus.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mats Leaderboard */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <CardTitle>Vault Mats Leaderboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Rank", "Address", "Total Mats", "Vault Share", "Bonus"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATS_LEADERBOARD.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={cn(
                      "border-b border-white/5 last:border-0 transition-colors",
                      entry.isUser ? "bg-purple-500/8 -mx-4 px-4" : "hover:bg-white/2",
                    )}
                  >
                    <td className="py-3 pr-4"><RankBadge rank={entry.rank} /></td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {entry.address}
                      {entry.isUser && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">You</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-bold font-mono text-purple-300">{entry.mats.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{entry.vaultShare}</td>
                    <td className="py-3 pr-4">
                      {entry.bonus ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                          {entry.bonus}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Referral Mats */}
      <ReferralWidget />

      {/* FAQ */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1" className="border-white/10">
              <AccordionTrigger className="hover:text-primary text-left">Do Mats guarantee a MEZO airdrop?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                No. Mats influence eligibility and potential allocation size but do not guarantee rewards. The
                distribution considers multiple factors beyond raw Mats accumulation to prevent gaming and ensure
                genuine ecosystem participation is rewarded. The more on-chain value and time committed, the
                higher the reward weighting.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-white/10">
              <AccordionTrigger className="hover:text-primary text-left">When do Mats stop accruing?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                All pre-mainnet Mats stopped accruing at mainnet launch in January 2026. Mainnet Mats continue
                to accrue through on-chain vault activity. The vault's automated compounding ensures your
                Mats keep growing every epoch without manual intervention.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-white/10">
              <AccordionTrigger className="hover:text-primary text-left">How is the referral bonus calculated?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                You earn 5% of every Mats event generated by wallets you referred — forever. If a referred
                wallet earns 500 Mats from a deposit, you automatically receive 25 bonus Mats. This bonus is
                lifetime and compounds across all their future vault activity.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-white/10">
              <AccordionTrigger className="hover:text-primary text-left">What is the minimum MEZO allocation threshold?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                In Phase 1, the minimum claim threshold was 60 MEZO. Addresses with an estimated allocation
                below this threshold were not eligible to claim. At the Season 2 rate of 36.78 mats/MEZO,
                you need at least ~2,207 Mats to exceed the minimum — easily achievable with a single NFT
                deposit and a few months of compound events.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
