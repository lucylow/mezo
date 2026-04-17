import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserPosition } from "@/hooks/useUserPosition";
import { TrendingUp, TrendingDown, Lock, Coins, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn, formatNumber } from "@/lib/utils";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const portfolioHistory = [
  { date: "Apr 1",  value: 8200 },
  { date: "Apr 5",  value: 9100 },
  { date: "Apr 9",  value: 9800 },
  { date: "Apr 13", value: 11200 },
  { date: "Apr 17", value: 12450 },
];

const allocation = [
  { name: "vveMEZO Shares", value: 60, color: "#F5A623" },
  { name: "Pending Rewards", value: 25, color: "#3B82F6" },
  { name: "Locked MEZO", value: 15, color: "#10B981" },
];

const recentRewards = [
  { epoch: 42, compounded: 48.2, date: "Apr 17" },
  { epoch: 41, compounded: 41.6, date: "Apr 10" },
  { epoch: 40, compounded: 39.1, date: "Apr 3" },
  { epoch: 39, compounded: 35.4, date: "Mar 27" },
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
        <p className="text-muted-foreground">Track your veMEZO positions and earnings.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value", value: "$12,450", sub: "+24.5% all time", up: true, icon: Coins },
          { label: "vveMEZO Shares", value: position.shares.toLocaleString(), sub: "Your vault shares", up: null, icon: Lock },
          { label: "APR Earned", value: `${vault.projectedAPR}%`, sub: "Current epoch", up: true, icon: TrendingUp },
          { label: "Compounded", value: "164.3 MEZO", sub: "All epochs", up: null, icon: ArrowUpRight },
        ].map((s) => (
          <Card key={s.label} className="bg-black/40 border-white/8">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">{s.label}</p>
                <s.icon className="h-4 w-4 text-primary opacity-70" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className={cn("text-xs mt-1", s.up === true ? "text-green-400" : s.up === false ? "text-red-400" : "text-muted-foreground")}>
                {s.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio growth chart + allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle className="text-base">Portfolio Value Over Time</CardTitle>
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

        <Card className="bg-black/40 border-white/8">
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

      {/* Reward history */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Compounding History</CardTitle>
          <Link href="/history">
            <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 text-xs text-muted-foreground uppercase tracking-wider pb-3 border-b border-white/8">
            <span>Epoch</span><span>Date</span><span className="text-right">MEZO Compounded</span><span className="text-right">vs Prior</span>
          </div>
          {recentRewards.map((r, i) => (
            <div key={r.epoch} className="grid grid-cols-4 py-3 text-sm border-b border-white/5 last:border-0">
              <span className="font-mono text-primary">#{r.epoch}</span>
              <span className="text-muted-foreground">{r.date}</span>
              <span className="text-right font-semibold">+{r.compounded} MEZO</span>
              <span className={cn("text-right text-xs", i === recentRewards.length - 1 ? "text-muted-foreground" : "text-green-400")}>
                {i === recentRewards.length - 1 ? "—" : `+${((r.compounded / recentRewards[i + 1].compounded - 1) * 100).toFixed(1)}%`}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
