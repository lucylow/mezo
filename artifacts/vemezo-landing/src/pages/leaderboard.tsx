import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Crown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { ReferralWidget } from "@/components/referralui/ReferralWidget";

interface LeaderboardEntry {
  rank: number;
  address: string;
  value: number;
  change: number;
  isUser?: boolean;
}

const TVL_BOARD: LeaderboardEntry[] = [
  { rank: 1,  address: "0x1234...5678", value: 2500000, change: 12.5 },
  { rank: 2,  address: "0xabcd...efgh", value: 1890000, change: -3.2 },
  { rank: 3,  address: "0x9876...5432", value: 1450000, change:  8.7 },
  { rank: 4,  address: "0xfedc...ba98", value: 1200000, change:  0   },
  { rank: 5,  address: "0x2468...1357", value:  980000, change: 15.3 },
  { rank: 6,  address: "0xdead...beef", value:  840000, change:  4.1 },
  { rank: 7,  address: "0xcafe...babe", value:  710000, change: -1.8 },
  { rank: 15, address: "0xYOUR...WALLET", value: 125000, change: 5.2, isUser: true },
];

const YIELD_BOARD: LeaderboardEntry[] = [
  { rank: 1,  address: "0xaaaa...bbbb", value: 145.6, change:  8.2 },
  { rank: 2,  address: "0xcccc...dddd", value: 132.4, change: -2.1 },
  { rank: 3,  address: "0xeeee...ffff", value: 128.9, change:  5.5 },
  { rank: 4,  address: "0x1111...2222", value: 118.3, change:  3.0 },
  { rank: 5,  address: "0x3333...4444", value: 105.7, change: -0.8 },
  { rank: 12, address: "0xYOUR...WALLET", value: 85.5, change: 3.1, isUser: true },
];

const TABS = [
  { key: "tvl",   label: "TVL Ranking",   icon: Trophy,    data: TVL_BOARD,   valueLabel: "MEZO Locked",  format: (v: number) => `${formatNumber(v)} MEZO` },
  { key: "yield", label: "Yield Earned",  icon: TrendingUp, data: YIELD_BOARD, valueLabel: "APR %",        format: (v: number) => `${v.toFixed(1)}%` },
  { key: "refs",  label: "Referrals",     icon: Users,      data: [],          valueLabel: "Referrals",    format: (v: number) => v.toString() },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">🥇</span>;
  if (rank === 2) return <span className="text-gray-300 font-bold">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉</span>;
  return <span className="font-mono text-muted-foreground">#{rank}</span>;
}

function ChangeCell({ change }: { change: number }) {
  if (change === 0) return <span className="flex items-center justify-end gap-0.5 text-muted-foreground"><Minus className="h-3 w-3" /> 0%</span>;
  const up = change > 0;
  return (
    <span className={cn("flex items-center justify-end gap-0.5", up ? "text-green-400" : "text-red-400")}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(change)}%
    </span>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState("tvl");
  const current = TABS.find(t => t.key === tab)!;
  const Icon = current.icon;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank against other veMEZO holders.</p>
      </div>

      {/* Your rank card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Your TVL Rank</p>
            <p className="text-2xl font-bold">#15</p>
            <p className="text-sm text-muted-foreground">Top 3% of all users</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground mb-0.5">To Next Rank (#14)</p>
            <p className="text-xl font-semibold">+12,500 MEZO</p>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm transition flex items-center gap-2",
              tab === t.key ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 text-primary" />
            {current.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {current.data.length === 0 ? (
            tab === "refs" ? (
              <div className="space-y-4 py-2">
                <ReferralWidget />
                <p className="text-xs text-muted-foreground text-center">
                  Referral volume ranks will appear here when the subgraph indexes referral events.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data for this view.</p>
            )
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-4 text-xs text-muted-foreground uppercase tracking-wider pb-3 border-b border-white/8">
                <span>Rank</span>
                <span>Address</span>
                <span className="text-right">{current.valueLabel}</span>
                <span className="text-right">Change</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-white/5">
                {current.data.map(entry => (
                  <div
                    key={entry.address}
                    className={cn(
                      "grid grid-cols-4 py-3 items-center text-sm",
                      entry.isUser && "bg-primary/10 -mx-4 px-4 rounded-lg",
                    )}
                  >
                    <span><RankBadge rank={entry.rank} /></span>
                    <span className="font-mono text-xs">
                      {entry.address}
                      {entry.isUser && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">You</span>
                      )}
                    </span>
                    <span className="text-right font-semibold">{current.format(entry.value)}</span>
                    <ChangeCell change={entry.change} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
