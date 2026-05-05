import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserPosition } from "@/hooks/useUserPosition";
import { useWallet } from "@/hooks/useWallet";
import { useVaultActivityFeed } from "@/hooks/api/useVaultAPI";
import { useEpochTimer } from "@/hooks/useEpochTimer";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/slider";
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, TrendingUp, Users, Coins, ShieldCheck, Wallet, Zap, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, pageTransition, cardHoverProps } from "@/lib/animations";
import { Link } from "wouter";
import { ReferralWidget } from "@/components/referralui/ReferralWidget";

function buildSimData(deposit: number, aprPct: number, feePct: number, months: number) {
  const netApr = aprPct * (1 - feePct / 100);
  const monthlyRate = netApr / 100 / 12;
  return Array.from({ length: months + 1 }, (_, i) => ({
    label: i === 0 ? "Now" : i % 6 === 0 ? `M${i}` : "",
    month: i,
    compounded: parseFloat((deposit * Math.pow(1 + monthlyRate, i)).toFixed(0)),
    simple: parseFloat((deposit * (1 + (netApr / 100) * (i / 12))).toFixed(0)),
  }));
}

function InteractiveSimulator({ apr, fee }: { apr: number; fee: number }) {
  const [deposit, setDeposit] = useState(10_000);
  const [months, setMonths] = useState(12);

  const data = useMemo(
    () => buildSimData(deposit, apr, fee, months),
    [deposit, apr, fee, months]
  );

  const final = data[data.length - 1];
  const gain = final.compounded - deposit;
  const edge = final.compounded - final.simple;

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">Compounding Simulator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Project your earnings with live APR</p>
        </div>
        <Badge variant="default" dot dotColor="bg-primary">{apr}% APR</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Initial Deposit</span>
              <span className="font-mono font-semibold text-primary">{deposit.toLocaleString()} MEZO</span>
            </div>
            <Slider
              min={1000} max={500_000} step={1000}
              value={[deposit]}
              onValueChange={([v]) => setDeposit(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1K</span><span>500K</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Horizon</span>
              <span className="font-mono font-semibold">{months}mo</span>
            </div>
            <Slider
              min={1} max={36} step={1}
              value={[months]}
              onValueChange={([v]) => setMonths(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 mo</span><span>36 mo</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Gain</p>
              <p className="text-base font-bold text-primary font-mono">+{gain.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">MEZO</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">vs Simple</p>
              <p className="text-base font-bold text-green-400 font-mono">+{edge.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">extra MEZO</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-3 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.15)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.15)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0b0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(v: number, name: string) => [`${v.toLocaleString()} MEZO`, name === "compounded" ? "Auto-compounded" : "Simple interest"]}
                labelFormatter={(_: any, payload: any) => payload?.[0] ? `Month ${payload[0].payload.month}` : ""}
              />
              <Line type="monotone" dataKey="simple" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} dot={false} name="simple" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="compounded" stroke="#F5A623" strokeWidth={2.5} dot={false} name="compounded" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-6 h-px bg-white/20" style={{ borderTop: "1.5px dashed rgba(255,255,255,0.3)" }} />
              Simple interest
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-6 h-0.5 bg-primary rounded" />
              Auto-compounded
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const FALLBACK_ACTIVITY = [
  { id: "f1", type: "deposit",  amount: "1,200 MEZO", time: "10 mins ago",  address: "0x4a...2f1" },
  { id: "f2", type: "compound", amount: "45 MEZO",    time: "1 hour ago",   address: "Vault" },
  { id: "f3", type: "withdraw", amount: "500 MEZO",   time: "2 hours ago",  address: "0x9b...1e3" },
  { id: "f4", type: "deposit",  amount: "3,450 MEZO", time: "5 hours ago",  address: "0x1c...8a4" },
  { id: "f5", type: "deposit",  amount: "800 MEZO",   time: "12 hours ago", address: "0x7d...4c2" },
];

function ActivityIcon({ type }: { type: string }) {
  const cfg = {
    deposit:  { bg: "bg-green-500/15",  icon: <ArrowDownRight className="h-3.5 w-3.5 text-green-400" /> },
    withdraw: { bg: "bg-red-500/15",    icon: <ArrowUpRight   className="h-3.5 w-3.5 text-red-400"   /> },
    compound: { bg: "bg-primary/15",    icon: <RefreshCw      className="h-3.5 w-3.5 text-primary"   /> },
  }[type] ?? { bg: "bg-white/10", icon: <Coins className="h-3.5 w-3.5" /> };

  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
      {cfg.icon}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0b0d]/95 px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
      <p className="text-muted-foreground mb-1">Day {label}</p>
      <p className="font-semibold text-primary">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

/** Format a relative time string from a unix timestamp (seconds). */
function relativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const stats = useVaultStats();
  const { isConnected } = useWallet();
  const position = useUserPosition();
  const activityFeed = useVaultActivityFeed();
  const epoch = useEpochTimer();

  // Build activity items: prefer live API data, fall back to mock
  const activityItems: Array<{ id: string; type: string; amount: string; time: string; address: string }> =
    activityFeed.data && activityFeed.data.length > 0
      ? activityFeed.data.slice(0, 5).map((item: any, i: number) => ({
          id:      item.txHash ?? `api-${i}`,
          type:    item.type ?? "compound",
          amount:  item.amount ? `${Number(item.amount).toLocaleString()} MEZO` : "—",
          time:    item.timestamp ? relativeTime(Number(item.timestamp)) : "—",
          address: item.address ? `${item.address.slice(0, 6)}...${item.address.slice(-4)}` : "Vault",
        }))
      : FALLBACK_ACTIVITY;

  const STATS = [
    {
      label: "Total Value Locked",
      icon: ShieldCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      value: stats.tvl / 1e6,
      prefix: "$",
      suffix: "M",
      decimals: 1,
      change: "+2.1%",
      changeUp: true,
      sub: "from last epoch",
    },
    {
      label: "Projected APR",
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
      value: stats.projectedAPR,
      prefix: "",
      suffix: "%",
      decimals: 0,
      change: "+3.2%",
      changeUp: true,
      sub: "Auto-compounded daily",
    },
    {
      label: "Pending Rewards",
      icon: Coins,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      value: stats.pendingRewards,
      prefix: "",
      suffix: "",
      decimals: 0,
      change: null,
      sub: "MEZO to be compounded",
    },
    {
      label: "Active Users",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      value: stats.totalUsers,
      prefix: "",
      suffix: "",
      decimals: 0,
      change: null,
      changeUp: true,
      sub: "unique depositors",
    },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor your veMEZO auto-compounding performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          <Clock className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-mono font-medium">
            Next Epoch:{" "}
            <span className="text-primary">{epoch.formatted}</span>
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={staggerItem}
              {...cardHoverProps}
              className="card-hover relative overflow-hidden rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-5"
            >
              <div className={cn("absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30", s.bg)} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className={cn("p-1.5 rounded-lg", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold mb-1.5", s.color)}>
                {s.prefix}
                <AnimatedNumber value={s.value} decimals={s.decimals} className="" />
                {s.suffix}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {s.change && (
                  <Badge variant={s.changeUp ? "success" : "danger"} size="sm" dot dotColor={s.changeUp ? "bg-green-400" : "bg-red-400"}>
                    {s.change}
                  </Badge>
                )}
                <span>{s.sub}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Middle row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Your Position */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Your Position</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Vault shares & earned rewards</p>
            </div>
            {isConnected && (
              <Badge variant="success" dot dotColor="bg-green-400">Live</Badge>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-glow-pulse">
                    <Wallet className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                  </div>
                </div>
                <p className="font-semibold mb-1">Connect to view your position</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Connect your wallet to see vault shares, earned rewards, and locked NFTs.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="connected"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Vault Shares",   value: position.vaultShares.toLocaleString(), unit: "veMEZO" },
                    { label: "Earned Rewards", value: position.earnedRewards.toLocaleString(), unit: "MEZO" },
                    { label: "NFTs in Vault",  value: String(position.nftsLocked.length), unit: "positions" },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-white/4 border border-white/6 p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="font-bold text-sm">{item.value}</p>
                      {item.unit && <p className="text-[10px] text-primary mt-0.5">{item.unit}</p>}
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Epoch progress</span>
                    <span className="text-primary font-medium">{epoch.epochProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${epoch.epochProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <div className="flex items-center gap-2">
              {activityFeed.isFetching && (
                <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
              )}
              <Link href="/history">
                <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {activityItems.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.2 }}
                className="flex items-center gap-3"
              >
                <ActivityIcon type={tx.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <span className="text-xs font-mono text-foreground">{tx.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground font-mono">{tx.address}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Compounding Simulation Chart — Interactive */}
      <InteractiveSimulator apr={stats.projectedAPR} fee={stats.performanceFee} />

      {/* Referral Widget */}
      <ReferralWidget />

      {/* Protocol Highlights */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-3"
      >
        {[
          {
            icon: "🔒",
            title: "Non-Custodial",
            desc: "Your assets remain in your control through smart contracts.",
          },
          {
            icon: "⚡",
            title: "Auto-Compounded",
            desc: "Rewards are automatically reinvested every epoch for maximum yield.",
          },
          {
            icon: "🛡️",
            title: "Multi-Keeper Security",
            desc: "Distributed keeper registry with 7-day deposit lock and compound cooldowns.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            {...cardHoverProps}
            className="card-hover rounded-2xl border border-white/8 bg-black/40 p-5 flex items-start gap-4"
          >
            <span className="text-2xl mt-0.5">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
