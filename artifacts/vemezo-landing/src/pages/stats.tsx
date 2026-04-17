import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVaultStats } from "@/hooks/useVaultStats";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ExternalLink } from "lucide-react";

const mockTvlData = [
  { date: "Oct 1", tvl: 3.2 },
  { date: "Oct 5", tvl: 3.5 },
  { date: "Oct 10", tvl: 3.8 },
  { date: "Oct 15", tvl: 4.0 },
  { date: "Oct 20", tvl: 4.2 },
];

const mockHistoryData = [
  { epoch: "Ep 42", rewards: 120, fee: 12, compounded: 108 },
  { epoch: "Ep 43", rewards: 150, fee: 15, compounded: 135 },
  { epoch: "Ep 44", rewards: 180, fee: 18, compounded: 162 },
  { epoch: "Ep 45", rewards: 140, fee: 14, compounded: 126 },
  { epoch: "Ep 46", rewards: 210, fee: 21, compounded: 189 },
];

export default function Stats() {
  const stats = useVaultStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Protocol Analytics</h2>
        <p className="text-sm text-muted-foreground">Deep dive into vault performance and history.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${(stats.tvl / 1000000).toFixed(2)}M</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Projected APR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{stats.projectedAPR}%</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{stats.totalShares.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.pendingRewards} MEZO</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Performance Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.performanceFee}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle>TVL Growth (Millions)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTvlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `$${val}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTvl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle>Compounding History (MEZO)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="compounded" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="fee" stackId="a" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle>Protocol Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
              <div>
                <p className="font-medium">Vault Contract</p>
                <p className="text-xs text-muted-foreground mt-1">Handles deposits, withdrawals, and compounding logic.</p>
              </div>
              <a href="#" className="mt-3 sm:mt-0 flex items-center gap-2 text-sm font-mono text-primary hover:underline">
                0x8F9...2A1B <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
              <div>
                <p className="font-medium">Strategy Contract</p>
                <p className="text-xs text-muted-foreground mt-1">Executes reward claiming and reinvestment.</p>
              </div>
              <a href="#" className="mt-3 sm:mt-0 flex items-center gap-2 text-sm font-mono text-primary hover:underline">
                0x3C4...9D8E <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
