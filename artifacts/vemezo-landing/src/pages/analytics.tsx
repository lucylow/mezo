import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Activity, Lock, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { BusinessMetrics } from "@/components/dashboard/BusinessMetrics";
import { cn } from "@/lib/utils";
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  Pie, PieChart, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const TVL_HISTORY = [
  { date: "Apr 1",  tvl: 45,  users: 38000, volume: 1.25 },
  { date: "Apr 5",  tvl: 52,  users: 39500, volume: 1.89 },
  { date: "Apr 9",  tvl: 61,  users: 41000, volume: 1.45 },
  { date: "Apr 13", tvl: 76.3,users: 42500, volume: 2.1 },
  { date: "Apr 17", tvl: 89.5,users: 43500, volume: 2.45 },
];

const EPOCH_REWARDS = [
  { epoch: "E38", rewards: 12400, fees: 1240 },
  { epoch: "E39", rewards: 14100, fees: 1410 },
  { epoch: "E40", rewards: 13200, fees: 1320 },
  { epoch: "E41", rewards: 15800, fees: 1580 },
  { epoch: "E42", rewards: 17200, fees: 1720 },
];

const FEE_DIST = [
  { name: "veBTC Holders", value: 45, color: "#F5A623" },
  { name: "veMEZO Holders", value: 30, color: "#3B82F6" },
  { name: "Treasury", value: 15, color: "#10B981" },
  { name: "Keeper",   value: 10, color: "#6B7280" },
];

const TIMEFRAMES = ["24h", "7d", "30d", "All"];

const METRICS = [
  { label: "Total Value Locked", value: "$89.5M", change: "+24.5%", up: true, icon: Lock },
  { label: "Active Users", value: "43,500", change: "+14.5%", up: true, icon: Users },
  { label: "Daily Volume", value: "$2.45M", change: "+16.7%", up: true, icon: Activity },
  { label: "Total Fees Earned", value: "$7.17M", change: "+31.2%", up: true, icon: DollarSign },
  { label: "Avg APR (7d)", value: "78%", change: "+2.1%", up: true, icon: TrendingUp },
  { label: "Epoch Rewards", value: "17,200 MEZO", change: "+8.9%", up: true, icon: Zap },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0a0b0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 },
  labelStyle: { color: "#aaa" },
};

export default function Analytics() {
  const [tf, setTf] = useState("7d");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-muted-foreground">Protocol-wide metrics and performance data.</p>
        </div>
        <div className="flex gap-2">
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition",
                tf === t ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <BusinessMetrics />

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {METRICS.map(m => (
          <Card key={m.label} className="bg-black/40 border-white/8">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <m.icon className="h-4 w-4 text-primary opacity-60" />
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className={cn("text-xs mt-1", m.up ? "text-green-400" : "text-red-400")}>
                {m.change} vs last epoch
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TVL chart */}
      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="text-base">Total Value Locked</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={TVL_HISTORY}>
              <defs>
                <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v}M`, "TVL"]} />
              <Area type="monotone" dataKey="tvl" stroke="#F5A623" strokeWidth={2} fill="url(#tvlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User growth + volume side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TVL_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), "Users"]} />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle className="text-base">Daily Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={TVL_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v}M`, "Volume"]} />
                <Bar dataKey="volume" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Epoch rewards + fee distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle className="text-base">Epoch Rewards vs Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={EPOCH_REWARDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="epoch" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString() + " MEZO"]} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#666" }} />
                <Bar dataKey="rewards" name="Rewards" fill="#F5A623" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fees" name="Fees" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle className="text-base">Fee Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={FEE_DIST} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {FEE_DIST.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {FEE_DIST.map(f => (
                <div key={f.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                    <span className="text-muted-foreground">{f.name}</span>
                  </div>
                  <span className="font-medium">{f.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
