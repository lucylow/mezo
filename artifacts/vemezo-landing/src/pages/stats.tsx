import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useVaultAPIHistory } from "@/hooks/api/useVaultAPI";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts";
import { ExternalLink, Loader2, TrendingUp, ShieldCheck, Coins, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

const MOCK_TVL_DATA = [
  { date: "Mar 27", tvl: 3.2 },
  { date: "Apr 3",  tvl: 3.5 },
  { date: "Apr 10", tvl: 3.8 },
  { date: "Apr 17", tvl: 4.0 },
  { date: "Apr 24", tvl: 4.2 },
];

const MOCK_HISTORY_DATA = [
  { epoch: "Ep 42", rewards: 120, fee: 12, compounded: 108 },
  { epoch: "Ep 43", rewards: 150, fee: 15, compounded: 135 },
  { epoch: "Ep 44", rewards: 180, fee: 18, compounded: 162 },
  { epoch: "Ep 45", rewards: 140, fee: 14, compounded: 126 },
  { epoch: "Ep 46", rewards: 210, fee: 21, compounded: 189 },
];

const EPOCH_TABLE = [
  { epoch: 46, date: "Apr 24", totalRewards: 210, compounded: 189, fee: 21, apr: "79.2%", tvl: "$4.20M" },
  { epoch: 45, date: "Apr 17", totalRewards: 140, compounded: 126, fee: 14, apr: "78.5%", tvl: "$4.05M" },
  { epoch: 44, date: "Apr 10", totalRewards: 180, compounded: 162, fee: 18, apr: "77.8%", tvl: "$3.92M" },
  { epoch: 43, date: "Apr 3",  totalRewards: 150, compounded: 135, fee: 15, apr: "76.1%", tvl: "$3.78M" },
  { epoch: 42, date: "Mar 27", totalRewards: 120, compounded: 108, fee: 12, apr: "74.9%", tvl: "$3.60M" },
];

const MOCK_APR_TREND = [
  { week: "W1", apr: 74.5 },
  { week: "W2", apr: 75.2 },
  { week: "W3", apr: 76.1 },
  { week: "W4", apr: 77.3 },
  { week: "W5", apr: 78.0 },
  { week: "W6", apr: 78.5 },
  { week: "W7", apr: 79.2 },
];

function formatDay(unixSec: number): string {
  if (!unixSec) return "";
  return new Date(unixSec * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Stats() {
  const stats = useVaultStats();
  const history = useVaultAPIHistory(30);

  const tvlData =
    history.data && history.data.length > 0
      ? history.data.map(m => ({
          date: formatDay(m.date),
          tvl:  m.tvl / 1_000_000,
        }))
      : MOCK_TVL_DATA;

  const rewardData =
    history.data && history.data.length > 0
      ? history.data.slice(-7).map((m, i) => ({
          epoch:      `D${i + 1}`,
          compounded: m.dailyRewards * 0.9,
          fee:        m.dailyRewards * 0.1,
        }))
      : MOCK_HISTORY_DATA;

  const STAT_CARDS = [
    {
      label: "Total Value Locked",
      value: `$${(stats.tvl / 1_000_000).toFixed(2)}M`,
      icon: ShieldCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      change: "+2.1%",
      up: true,
    },
    {
      label: "Projected APR",
      value: `${stats.projectedAPR}%`,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
      change: "+0.7%",
      up: true,
    },
    {
      label: "Total Shares",
      value: stats.totalShares.toLocaleString(),
      icon: Zap,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      change: null,
      up: null,
    },
    {
      label: "Pending Rewards",
      value: `${stats.pendingRewards} MEZO`,
      icon: Coins,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      change: null,
      up: null,
    },
    {
      label: "Performance Fee",
      value: `${stats.performanceFee}%`,
      icon: ShieldCheck,
      color: "text-muted-foreground",
      bg: "bg-white/5",
      change: null,
      up: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Protocol Analytics</h2>
          <p className="text-sm text-muted-foreground">Deep dive into vault performance and history.</p>
        </div>
        {history.isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Fetching live data…
          </div>
        )}
      </div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-5"
      >
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={staggerItem}
              className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
              {s.change && (
                <Badge
                  variant={s.up ? "success" : "danger"}
                  size="sm"
                  dot
                  dotColor={s.up ? "bg-green-400" : "bg-red-400"}
                  className="mt-2"
                >
                  {s.change} this epoch
                </Badge>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>TVL Growth (Millions)</CardTitle>
              {history.data && history.data.length > 0 ? (
                <Badge variant="success" dot dotColor="bg-green-400">Live · 30d</Badge>
              ) : (
                <Badge variant="muted">Mock data</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tvlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `$${val}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(val: number) => [`$${val.toFixed(2)}M`, "TVL"]}
                  />
                  <Area type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTvl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>APR Trend</CardTitle>
              <Badge variant="default">Last 7 weeks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_APR_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(v) => `${v}%`} domain={[70, 82]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(val: number) => [`${val}%`, "Projected APR"]}
                  />
                  <Line type="monotone" dataKey="apr" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily rewards chart */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Rewards (MEZO)</CardTitle>
            {history.data && history.data.length > 0 && (
              <Badge variant="default">Last 7 days</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rewardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="compounded" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} name="Compounded" />
                <Bar dataKey="fee" stackId="a" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Protocol Fee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Epoch breakdown table */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Epoch Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Epoch", "Date", "Total Rewards", "Compounded", "Fee", "APR", "TVL"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EPOCH_TABLE.map((row) => (
                  <tr key={row.epoch} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4 font-mono text-primary font-semibold">#{row.epoch}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.date}</td>
                    <td className="py-3 pr-4 font-mono">{row.totalRewards} MEZO</td>
                    <td className="py-3 pr-4 font-mono text-green-400">+{row.compounded} MEZO</td>
                    <td className="py-3 pr-4 font-mono text-muted-foreground">{row.fee} MEZO</td>
                    <td className="py-3 pr-4 font-mono text-primary">{row.apr}</td>
                    <td className="py-3 pr-4 font-mono">{row.tvl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Contracts */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Protocol Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Vault Contract",
                desc: "Handles deposits, withdrawals, compounding, and multi-keeper coordination.",
                addr: "0x8F9...2A1B",
              },
              {
                name: "Strategy Contract",
                desc: "Executes reward claiming, DEX swaps, and MUSD auto-staking.",
                addr: "0x3C4...9D8E",
              },
            ].map((c) => (
              <div key={c.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                </div>
                <a
                  href="#"
                  className="mt-3 sm:mt-0 flex items-center gap-2 text-sm font-mono text-primary hover:underline shrink-0"
                >
                  {c.addr} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
