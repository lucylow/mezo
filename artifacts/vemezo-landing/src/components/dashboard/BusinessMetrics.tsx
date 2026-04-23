import { useVaultStats } from "@/hooks/useVaultStats";
import { useTreasuryStats } from "@/hooks/contracts/useTreasuryRead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank } from "lucide-react";
import { formatNumber, formatUSD } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP = {
  contentStyle: {
    backgroundColor: "#0a0b0d",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
};

export function BusinessMetrics() {
  const { tvl, totalFeesCollected, performanceFee, projectedAPR } = useVaultStats();
  const { treasuryValue, treasuryAPY, strategyAllocation } = useTreasuryStats();

  const feePct = performanceFee ?? 10;
  const apr = projectedAPR ?? 78;
  const estimatedAnnualRevenue = tvl * (apr / 100) * (feePct / 100);

  const revenueHistory = [
    { date: "Apr 1", revenue: 12_500 },
    { date: "Apr 8", revenue: 18_200 },
    { date: "Apr 15", revenue: 21_000 },
    { date: "Apr 22", revenue: 24_500 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Business metrics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total value locked</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUSD(tvl)}</p>
            <p className="text-xs text-muted-foreground mt-1">Vault aggregate</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projected APR</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{apr}%</p>
            <p className="text-xs text-muted-foreground mt-1">Illustrative</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fees collected</CardTitle>
            <PiggyBank className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalFeesCollected)} MUSD</p>
            <p className="text-xs text-muted-foreground mt-1">Subgraph or on-chain</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treasury value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUSD(treasuryValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {treasuryAPY > 0 ? `~${treasuryAPY.toFixed(1)}% blended APY` : "Deploy treasury manager"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle>Revenue history (MUSD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory}>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={TOOLTIP.contentStyle}
                    formatter={(v: number) => [`${formatNumber(v)} MUSD`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F5A623"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/8">
          <CardHeader>
            <CardTitle>Fee structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Performance fee</span>
              <span className="font-semibold text-primary">{feePct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deposit fee</span>
              <span className="font-semibold text-green-400">0%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Withdrawal fee</span>
              <span className="font-semibold text-green-400">0%</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Est. annual revenue</span>
                <span className="text-xl font-bold text-primary">{formatUSD(estimatedAnnualRevenue)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">From TVL × illustrative APR × fee</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Treasury yield strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategyAllocation.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Set `VITE_TREASURY_MANAGER_ADDRESS` to read live allocation from `TreasuryYieldManager`.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategyAllocation.map((strategy) => (
                <div key={strategy.name} className="p-4 bg-white/5 rounded-xl border border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{strategy.name}</span>
                    <span className="text-xs text-muted-foreground">{strategy.allocation}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-500"
                      style={{ width: `${Math.min(100, strategy.allocation)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Illustrative APY</span>
                    <span className="font-semibold text-green-400">{strategy.apy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
