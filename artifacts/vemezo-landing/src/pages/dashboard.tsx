import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserPosition } from "@/hooks/useUserPosition";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, TrendingUp, Users, Coins, ShieldCheck, Wallet, Zap, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, pageTransition, cardHoverProps } from "@/lib/animations";

const mockSimulationData = [
  { day: 0,   balance: 1000 },
  { day: 30,  balance: 1065 },
  { day: 60,  balance: 1134 },
  { day: 90,  balance: 1207 },
  { day: 120, balance: 1286 },
  { day: 150, balance: 1369 },
  { day: 180, balance: 1458 },
  { day: 365, balance: 2180 },
];

const mockActivity = [
  { id: 1, type: "deposit",  amount: "1,200 MEZO", time: "10 mins ago",  address: "0x4a...2f1" },
  { id: 2, type: "compound", amount: "45 MEZO",    time: "1 hour ago",   address: "Vault" },
  { id: 3, type: "withdraw", amount: "500 MEZO",   time: "2 hours ago",  address: "0x9b...1e3" },
  { id: 4, type: "deposit",  amount: "3,450 MEZO", time: "5 hours ago",  address: "0x1c...8a4" },
  { id: 5, type: "deposit",  amount: "800 MEZO",   time: "12 hours ago", address: "0x7d...4c2" },
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

export default function Dashboard() {
  const stats = useVaultStats();
  const { isConnected } = useWallet();
  const position = useUserPosition();
  const [timeLeft, setTimeLeft] = useState(3 * 24 * 60 * 60 + 14 * 60 * 60);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

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
      value: 1234,
      prefix: "",
      suffix: "",
      decimals: 0,
      change: "+12",
      changeUp: true,
      sub: "this week",
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
            Next Epoch in:{" "}
            <span className="text-primary">{formatTime(timeLeft)}</span>
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
              {/* Subtle glow in corner */}
              <div className={cn("absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30", s.bg)} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className={cn("p-1.5 rounded-lg", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold mb-1.5", s.color)}>
                {s.prefix}
                <AnimatedNumber
                  value={s.value}
                  decimals={s.decimals}
                  className=""
                />
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
                    { label: "Vault Shares",     value: position.vaultShares.toLocaleString(), unit: "veMEZO" },
                    { label: "Earned Rewards",   value: position.earnedRewards.toLocaleString(), unit: "MEZO" },
                    { label: "Locked Until",     value: "Day 180", unit: "" },
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
                    <span className="text-primary font-medium">62%</span>
                  </div>
                  <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: "62%" }}
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
            <button className="text-xs text-primary hover:underline">View all →</button>
          </div>
          <div className="space-y-3">
            {mockActivity.map((tx, i) => (
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

      {/* Compounding Simulation Chart */}
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Compounding Simulation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Projected growth on $1,000 at current APR</p>
          </div>
          <Badge variant="default" dot dotColor="bg-primary">78% APR</Badge>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={mockSimulationData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F5A623" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={v => `D${v}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={v => `$${v.toLocaleString()}`}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#F5A623"
              strokeWidth={2}
              fill="url(#colorBalance)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

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
            title: "Audited Protocol",
            desc: "Fully audited by leading Web3 security firms.",
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
