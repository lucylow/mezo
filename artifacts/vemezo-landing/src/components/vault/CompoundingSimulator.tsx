import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useVaultStats } from "@/hooks/useVaultStats";
import { TrendingUp, Clock, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface ProjectionPoint {
  month: number;
  label: string;
  valueNoCompound: number;
  valueCompound: number;
}

function projectGrowth(
  initial: number,
  aprPct: number,
  feePct: number,
  months: number,
): ProjectionPoint[] {
  const netApr = aprPct * (1 - feePct / 100);
  const monthlyRate = netApr / 100 / 12;

  return Array.from({ length: months + 1 }, (_, i) => ({
    month: i,
    label: i === 0 ? "Now" : `M${i}`,
    valueNoCompound: parseFloat((initial * (1 + (netApr / 100) * (i / 12))).toFixed(2)),
    valueCompound: parseFloat((initial * Math.pow(1 + monthlyRate, i)).toFixed(2)),
  }));
}

export function CompoundingSimulator() {
  const { projectedAPR, performanceFee } = useVaultStats();

  const apr = projectedAPR ?? 78;
  const fee = performanceFee ?? 10;

  const [depositAmount, setDepositAmount] = useState(10_000);
  const [timeHorizon,   setTimeHorizon]   = useState(12);

  const data = useMemo(
    () => projectGrowth(depositAmount, apr, fee, timeHorizon),
    [depositAmount, apr, fee, timeHorizon],
  );

  const final       = data[data.length - 1];
  const gain        = final.valueCompound - depositAmount;
  const gainNoComp  = final.valueNoCompound - depositAmount;
  const compoundEdge = gain - gainNoComp;

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-primary" />
          Compounding Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Deposit slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground">Initial deposit</Label>
            <span className="text-sm font-mono font-semibold">
              {depositAmount.toLocaleString()} MEZO
            </span>
          </div>
          <Slider
            min={1000}
            max={500_000}
            step={1000}
            value={[depositAmount]}
            onValueChange={([v]) => setDepositAmount(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1K</span><span>500K</span>
          </div>
        </div>

        {/* Time horizon slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time horizon
            </Label>
            <span className="text-sm font-mono font-semibold">
              {timeHorizon} {timeHorizon === 1 ? "month" : "months"}
            </span>
          </div>
          <Slider
            min={1}
            max={36}
            step={1}
            value={[timeHorizon]}
            onValueChange={([v]) => setTimeHorizon(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 mo</span><span>36 mo</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["auto", "auto"]} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#050608",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                itemStyle={{ color: "#fff" }}
                formatter={(v: number) => [`${v.toLocaleString()} MEZO`]}
              />
              <Line
                type="monotone"
                dataKey="valueNoCompound"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                dot={false}
                name="Simple interest"
              />
              <Line
                type="monotone"
                dataKey="valueCompound"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Auto-compounded"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Result summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" /> Auto-compounded
            </p>
            <p className="text-lg font-bold font-mono text-primary">
              +{gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">MEZO gain</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Compound edge</p>
            <p className="text-lg font-bold font-mono text-green-400">
              +{compoundEdge.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">vs simple</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Based on {apr}% APR with {fee}% performance fee. Projections are indicative only.
        </p>
      </CardContent>
    </Card>
  );
}
