import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserPosition } from "@/hooks/useUserPosition";
import { TrendingUp, Lock, Coins, Wallet, ArrowUpRight, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Link } from "wouter";
import { cn, formatNumber } from "@/lib/utils";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, pageTransition } from "@/lib/animations";

const portfolioHistory = [
  { date: "Apr 1",  value: 8200 },
  { date: "Apr 5",  value: 9100 },
  { date: "Apr 9",  value: 9800 },
  { date: "Apr 13", value: 11200 },
  { date: "Apr 17", value: 12450 },
];

const recentRewards = [
  { epoch: 46, compounded: 48.2, fee: 5.4,  date: "Apr 24", apr: "79.2%" },
  { epoch: 45, compounded: 41.6, fee: 4.6,  date: "Apr 17", apr: "78.5%" },
  { epoch: 44, compounded: 39.1, fee: 4.3,  date: "Apr 10", apr: "77.8%" },
  { epoch: 43, compounded: 35.4, fee: 3.9,  date: "Apr 3",  apr: "76.1%" },
];

export default function Portfolio() {
  const { isConnected, connect } = useWallet();
  const vault = useVaultStats();
  const position = useUserPosition();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
          <p className="text-muted-foreground">Track your veMEZO positions and earnings.</p>
        </div>
        <Card className="py-16 text-center bg-black/40 border-white/8">
          <div className="flex flex-col items-center gap-4">
            <div className="p-5 rounded-full bg-primary/10">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-semibold">Connect your wallet</p>
            <p className="text-muted-foreground text-sm">Connect to see your portfolio positions and earnings history.</p>
            <Button onClick={connect} className="mt-2">Connect Wallet</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalValueUSD = position.valueUSD || (position.shares * 1.05 * 22.5);
  const earnedTotal = position.earnedMEZO || 164.3;
  const nftCount = position.nftsLocked.length;

  const allocation = [
    { name: "vveMEZO Shares", value: 60, color: "#F5A623" },
    { name: "Pending Rewards", value: 25, color: "#3B82F6" },
    { name: "Locked MEZO",    value: 15, color: "#10B981" },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
          <p className="text-muted-foreground">Track your veMEZO positions and earnings.</p>
        </div>
        <Badge variant="success" dot dotColor="bg-green-400">Live</Badge>
      </div>

      {/* Summary cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Value",
            icon: Coins,
            color: "text-primary",
            bg: "bg-primary/10",
            value: totalValueUSD,
            prefix: "$",
            suffix: "",
            decimals: 0,
            sub: "+24.5% all time",
            subColor: "text-green-400",
          },
          {
            label: "vveMEZO Shares",
            icon: Lock,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            value: position.shares,
            prefix: "",
            suffix: "",
            decimals: 0,
            sub: "Your vault shares",
            subColor: "text-muted-foreground",
          },
          {
            label: "Current APR",
            icon: TrendingUp,
            color: "text-green-400",
            bg: "bg-green-500/10",
            value: vault.projectedAPR,
            prefix: "",
            suffix: "%",
            decimals: 0,
            sub: "Auto-compounded",
            subColor: "text-green-400",
          },
          {
            label: "Total Compounded",
            icon: ArrowUpRight,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            value: earnedTotal,
            prefix: "",
            suffix: " MEZO",
            decimals: 1,
            sub: "All epochs",
            subColor: "text-muted-foreground",
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">{s.label}</p>
              <div className={cn("p-1.5 rounded-lg", s.bg)}>
                <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold", s.color)}>
              {s.prefix}
              <AnimatedNumber value={s.value} decimals={s.decimals} className="" />
              {s.suffix}
            </p>
            <p className={cn("text-xs mt-1", s.subColor)}>{s.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Portfolio growth chart + allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-white/8 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Portfolio Value Over Time</CardTitle>
              <Badge variant="default">Last 30 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0a0b0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                  labelStyle={{ color: "#aaa" }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2} fill="url(#pvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={allocation} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {allocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0a0b0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {allocation.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="text-muted-foreground">{a.name}</span>
                  </div>
                  <span className="font-medium">{a.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active NFT positions */}
      {nftCount > 0 && (
        <Card className="bg-black/40 border-white/8 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active NFT Positions</CardTitle>
            <Link href="/vault">
              <span className="text-xs text-primary hover:underline cursor-pointer">Manage →</span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {position.nftsLocked.map((nft) => {
                const nowSec = Math.floor(Date.now() / 1000);
                const secsLeft = nft.depositUnlockAt > 0 ? Math.max(0, nft.depositUnlockAt - nowSec) : 0;
                const isLocked = nft.depositLocked && secsLeft > 0;
                const daysLeft = Math.ceil(secsLeft / 86_400);
                return (
                  <div
                    key={nft.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border",
                      isLocked ? "bg-yellow-500/5 border-yellow-500/15" : "bg-white/4 border-white/8"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", isLocked ? "bg-yellow-500/15" : "bg-primary/10")}>
                        {isLocked ? <Clock className="h-4 w-4 text-yellow-400" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-primary text-sm">NFT #{nft.id}</p>
                        {isLocked ? (
                          <p className="text-xs text-yellow-400">{daysLeft}d deposit lock remaining</p>
                        ) : (
                          <p className="text-xs text-green-400">Available to withdraw</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {nft.amount > 0 && (
                        <p className="text-sm font-semibold">{nft.amount.toLocaleString()} MEZO</p>
                      )}
                      <Badge variant={isLocked ? "warning" : "success"} size="sm">
                        {isLocked ? "Locked" : "Unlocked"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reward history */}
      <Card className="bg-black/40 border-white/8 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Compounding History</CardTitle>
          <Link href="/history">
            <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 text-xs text-muted-foreground uppercase tracking-wider pb-3 border-b border-white/8">
            <span>Epoch</span><span>Date</span><span className="text-right">Compounded</span><span className="text-right">Fee</span><span className="text-right">APR</span>
          </div>
          {recentRewards.map((r, i) => (
            <div key={r.epoch} className="grid grid-cols-5 py-3 text-sm border-b border-white/5 last:border-0 hover:bg-white/2 -mx-2 px-2 rounded-lg transition">
              <span className="font-mono text-primary">#{r.epoch}</span>
              <span className="text-muted-foreground">{r.date}</span>
              <span className="text-right text-green-400 font-semibold">+{r.compounded} MEZO</span>
              <span className="text-right text-muted-foreground">{r.fee} MEZO</span>
              <span className="text-right font-mono text-primary">{r.apr}</span>
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-white/8 grid grid-cols-2 gap-4">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Total compounded (4 epochs)</p>
              <p className="font-bold text-primary">+{recentRewards.reduce((a, r) => a + r.compounded, 0).toFixed(1)} MEZO</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Fees paid (4 epochs)</p>
              <p className="font-bold">{recentRewards.reduce((a, r) => a + r.fee, 0).toFixed(1)} MEZO</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
