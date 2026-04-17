import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserPosition } from "@/hooks/useUserPosition";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, TrendingUp, Users, Coins, ArrowRightLeft, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const mockSimulationData = [
  { day: 0, balance: 1000 },
  { day: 30, balance: 1065 },
  { day: 60, balance: 1134 },
  { day: 90, balance: 1207 },
  { day: 120, balance: 1286 },
  { day: 150, balance: 1369 },
  { day: 180, balance: 1458 },
  { day: 365, balance: 2180 },
];

const mockActivity = [
  { id: 1, type: "deposit", amount: "1,200 MEZO", time: "10 mins ago", address: "0x4a...2f1" },
  { id: 2, type: "compound", amount: "45 MEZO", time: "1 hour ago", address: "Vault" },
  { id: 3, type: "withdraw", amount: "500 MEZO", time: "2 hours ago", address: "0x9b...1e3" },
  { id: 4, type: "deposit", amount: "3,450 MEZO", time: "5 hours ago", address: "0x1c...8a4" },
  { id: 5, type: "deposit", amount: "800 MEZO", time: "12 hours ago", address: "0x7d...4c2" },
];

export default function Dashboard() {
  const stats = useVaultStats();
  const { isConnected, connect } = useWallet();
  const position = useUserPosition();

  const [timeLeft, setTimeLeft] = useState(3 * 24 * 60 * 60 + 14 * 60 * 60); // 3 days 14h in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your veMEZO auto-compounding performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono font-medium">Next Epoch in: <span className="text-primary">{formatTime(timeLeft)}</span></span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.tvl / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">+2.1% from last epoch</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projected APR</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.projectedAPR}%</div>
            <p className="text-xs text-muted-foreground mt-1">Auto-compounded daily</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Rewards</CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRewards.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">MEZO to be compounded</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground mt-1">+12 this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle>Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Connect to view your position</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Connect your wallet to see your vault shares, earned rewards, and locked NFTs.
                </p>
                <Button onClick={connect} className="mt-2">Connect Wallet</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Vault Shares</p>
                    <p className="text-3xl font-bold font-mono">{position.shares.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">~${position.valueUSD.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Earned Rewards</p>
                    <p className="text-3xl font-bold font-mono text-primary">+{position.earnedMEZO}</p>
                    <p className="text-xs text-muted-foreground">MEZO compounded</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm font-medium mb-3">Locked NFTs Deposited</p>
                  <div className="flex flex-wrap gap-2">
                    {position.nftsLocked.map(nft => (
                      <div key={nft.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <span className="font-mono text-xs text-primary">#{nft.id}</span>
                        <span className="font-medium">{nft.amount} MEZO</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      act.type === 'deposit' ? 'bg-green-500/10 text-green-500' :
                      act.type === 'withdraw' ? 'bg-red-500/10 text-red-500' :
                      'bg-primary/10 text-primary'
                    )}>
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{act.type}</p>
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{act.amount}</p>
                    <p className="text-xs font-mono text-muted-foreground">{act.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Compounding Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockSimulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `Day ${val}`}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
