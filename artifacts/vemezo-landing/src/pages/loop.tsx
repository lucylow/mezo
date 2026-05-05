import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/slider";
import { useLoopSimulator, MAX_LOOPS, MIN_DEPOSIT } from "@/hooks/useLoopSimulator";
import { useActiveLoops } from "@/hooks/useActiveLoops";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  Layers, AlertCircle, TrendingUp, Shield, Zap, ArrowRight,
  BarChart3, RefreshCw, Wallet, ChevronRight, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "simulator" | "positions" | "strategies";

// ── Strategy templates from research document ─────────────────────────────────

const STRATEGIES = [
  {
    id:          "musd-power",
    name:        "MUSD Power Loop",
    description: "upMUSD → Morpho Alpha Vault → 4× leverage",
    apyRange:    "45 – 65%",
    risk:        "Medium" as const,
    minDeposit:  5_000,
    loops:       4,
    featured:    true,
    color:       "text-primary",
    bg:          "bg-primary/10",
    border:      "border-primary/20",
  },
  {
    id:          "solvbtc-yield",
    name:        "solvBTC Yield",
    description: "solvBTC collateral → MUSD borrow → Upshift deposit",
    apyRange:    "28 – 42%",
    risk:        "Low" as const,
    minDeposit:  10_000,
    loops:       2,
    featured:    false,
    color:       "text-blue-400",
    bg:          "bg-blue-500/10",
    border:      "border-blue-500/20",
  },
  {
    id:          "alpha-conservative",
    name:        "Alpha Conservative",
    description: "aMUSD core Morpho vault → 2× safe loop",
    apyRange:    "22 – 35%",
    risk:        "Very Low" as const,
    minDeposit:  2_500,
    loops:       2,
    featured:    false,
    color:       "text-green-400",
    bg:          "bg-green-500/10",
    border:      "border-green-500/20",
  },
];

const RISK_BADGE: Record<string, string> = {
  "Very Low": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Low:        "text-green-400  bg-green-500/10  border-green-500/20",
  Medium:     "text-amber-400  bg-amber-500/10  border-amber-500/20",
  High:       "text-red-400    bg-red-500/10    border-red-500/20",
};

// ── Health meter ──────────────────────────────────────────────────────────────

function HealthBar({ hf }: { hf: number }) {
  const pct   = Math.min(Math.max(((hf - 1) / 2) * 100, 0), 100);
  const color = hf > 2 ? "bg-emerald-400" : hf > 1.5 ? "bg-amber-400" : "bg-red-400";
  const text  = hf > 2 ? "text-emerald-400" : hf > 1.5 ? "text-amber-400" : "text-red-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Health Factor</span>
        <span className={cn("font-mono font-bold", text)}>{hf.toFixed(2)}×</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  label, value, sub, color = "text-foreground", icon: Icon,
}: {
  label: string; value: string; sub?: string;
  color?: string; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/8 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/40" />}
      </div>
      <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── Simulator tab ─────────────────────────────────────────────────────────────

function SimulatorTab({
  onSelectStrategy,
}: { onSelectStrategy: (loops: number, deposit: number) => void }) {
  const { deposit, setDeposit, loops, setLoops, result } = useLoopSimulator();

  const riskColor =
    result.riskLevel === "safe"    ? "text-emerald-400" :
    result.riskLevel === "warning" ? "text-amber-400"   : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="bg-black/40 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Loop Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Deposit slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Initial Deposit (MUSD)</label>
                <span className="text-xl font-bold font-mono text-primary">
                  ${deposit.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[deposit]}
                onValueChange={([v]) => setDeposit(v)}
                min={MIN_DEPOSIT}
                max={100_000}
                step={1_000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$1,000</span>
                <span>$100,000</span>
              </div>
            </div>

            {/* Loop count slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Loop Iterations</label>
                <span className="text-xl font-bold font-mono text-primary">{loops}×</span>
              </div>
              <Slider
                value={[loops]}
                onValueChange={([v]) => setLoops(v)}
                min={1}
                max={MAX_LOOPS}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 loop (safe)</span>
                <span>{MAX_LOOPS} loops (max)</span>
              </div>
            </div>

            {/* Info row */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/8 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary/50" />
              <span>
                LTV decreases per loop: 70% → 65% → 60% → 55% → 50%. Supply APY 30% (upMUSD),
                borrow rate 1% (Morpho). Liquidation threshold 85%.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-black/40 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="Projected APY"
                value={`${result.projectedAPY.toFixed(1)}%`}
                sub={`Gross ${result.grossAPY.toFixed(1)}% − borrow ${result.borrowCostAPY.toFixed(1)}%`}
                color="text-primary"
                icon={TrendingUp}
              />
              <ResultCard
                label="Health Factor"
                value={`${result.healthFactor === 99 ? "∞" : result.healthFactor.toFixed(2)}×`}
                sub={result.riskLevel === "safe" ? "Safe zone" : result.riskLevel === "warning" ? "Monitor closely" : "High risk"}
                color={riskColor}
                icon={Shield}
              />
              <ResultCard
                label="Position Size"
                value={`$${Math.round(result.totalCollateral).toLocaleString()}`}
                sub={`${result.positionMultiple.toFixed(2)}× initial`}
              />
              <ResultCard
                label="Liq. Buffer"
                value={`${result.liquidationBuffer.toFixed(1)}%`}
                sub="Drop before liquidation"
                color={result.liquidationBuffer > 30 ? "text-emerald-400" : result.liquidationBuffer > 15 ? "text-amber-400" : "text-red-400"}
              />
            </div>

            <HealthBar hf={result.healthFactor} />

            {result.riskLevel === "danger" && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-300">High liquidation risk</p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    Reduce loop count or increase initial deposit to improve safety.
                  </p>
                </div>
              </div>
            )}
            {result.riskLevel === "warning" && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-300">Monitor your position</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Health factor below 2×. Auto-deleverage triggers at 1.2×.
                  </p>
                </div>
              </div>
            )}

            <Button className="w-full gap-2" disabled>
              Deploy Loop <ArrowRight className="h-4 w-4" />
              <span className="text-xs opacity-60">(Mainnet soon)</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Iteration breakdown table */}
      {result.iterationBreakdown.length > 0 && (
        <Card className="bg-black/40 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Loop-by-Loop Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Loop", "LTV", "Deposited", "Borrowed", "Total Collateral", "Total Debt", "Health Factor"].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider pb-3 pr-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.iterationBreakdown.map((step) => {
                    const hf = step.cumulativeDebt > 0
                      ? (step.cumulativeCollateral * 0.85) / step.cumulativeDebt
                      : 99;
                    const hfColor = hf > 2 ? "text-emerald-400" : hf > 1.5 ? "text-amber-400" : "text-red-400";
                    return (
                      <tr key={step.loop} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="py-3 pr-4 font-semibold">#{step.loop}</td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono">{(step.ltv * 100).toFixed(0)}%</td>
                        <td className="py-3 pr-4 font-mono">${Math.round(step.inputCollateral).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono text-primary">${Math.round(step.borrowed).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono">${Math.round(step.cumulativeCollateral).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono text-red-400/70">${Math.round(step.cumulativeDebt).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono font-bold">
                          <span className={hfColor}>{hf === 99 ? "∞" : hf.toFixed(2)}×</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Positions tab ─────────────────────────────────────────────────────────────

function PositionsTab() {
  const { isConnected } = useWallet();
  const { data: positions = [], isLoading } = useActiveLoops();

  if (!isConnected) {
    return (
      <Card className="bg-black/40 border-white/10 rounded-2xl">
        <CardContent className="py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold mb-1">Connect wallet to view loop positions</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your active MUSD loops and associated health metrics will appear here once connected.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 rounded-2xl">
        <CardContent className="py-16 text-center text-muted-foreground">Loading positions…</CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="bg-black/40 border-white/10 rounded-2xl">
        <CardContent className="py-16 flex flex-col items-center text-center">
          <Layers className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="font-semibold mb-1">No active loops</p>
          <p className="text-sm text-muted-foreground">Use the Simulator tab to build and deploy your first loop.</p>
        </CardContent>
      </Card>
    );
  }

  const totalCollateral = positions.reduce((s, p) => s + p.collateral, 0);
  const totalDebt       = positions.reduce((s, p) => s + p.debt, 0);
  const avgHF           = positions.reduce((s, p) => s + p.healthFactor, 0) / positions.length;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Total Collateral",  value: `$${totalCollateral.toLocaleString()}` },
          { label: "Total Debt",        value: `$${totalDebt.toLocaleString()}`,       color: "text-red-400/80" },
          { label: "Avg Health Factor", value: `${avgHF.toFixed(2)}×`,                color: avgHF > 2 ? "text-emerald-400" : "text-amber-400" },
        ].map(s => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="rounded-xl bg-white/5 border border-white/8 p-4 text-center"
          >
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-xl font-bold font-mono", s.color ?? "text-foreground")}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Position cards */}
      {positions.map((pos) => {
        const hfColor = pos.healthFactor > 2 ? "text-emerald-400" : pos.healthFactor > 1.5 ? "text-amber-400" : "text-red-400";
        const bufferPct = Math.max(0, ((pos.healthFactor - 1) / pos.healthFactor) * 100);
        return (
          <Card key={pos.id} className="bg-black/40 border-white/10 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{pos.strategy}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{pos.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge variant="success" size="sm" dot dotColor="bg-green-400">{pos.loops}× Loop</Badge>
                  <Badge variant="info" size="sm">{pos.apy}% APY</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Collateral</p>
                  <p className="text-lg font-bold font-mono">${pos.collateral.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Debt</p>
                  <p className="text-lg font-bold font-mono text-red-400/80">${pos.debt.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Net Equity</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">${pos.netEquity.toLocaleString()}</p>
                </div>
              </div>

              <HealthBar hf={pos.healthFactor} />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-white/3">
                  <span className="text-muted-foreground">Liq. Buffer</span>
                  <span className={cn("font-mono", hfColor)}>{bufferPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/3">
                  <span className="text-muted-foreground">Opened</span>
                  <span className="font-mono">{pos.createdAt}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 border-white/10 text-sm" disabled>
                  Add Collateral
                </Button>
                <Button variant="outline" className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm" disabled>
                  Unwind Loop
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Contract interactions coming with mainnet deployment</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Strategies tab ────────────────────────────────────────────────────────────

function StrategiesTab({ onDeploy }: { onDeploy: (loops: number, deposit: number) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Pre-configured loop strategies. Click "Simulate" to load parameters into the simulator.
      </p>

      <div className="grid md:grid-cols-3 gap-5">
        {STRATEGIES.map((s) => (
          <div
            key={s.id}
            className={cn(
              "relative rounded-2xl border p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform",
              s.border, s.bg,
              s.featured && "ring-1 ring-primary/30",
            )}
          >
            {s.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-background text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                Recommended
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", RISK_BADGE[s.risk])}>
                {s.risk} Risk
              </span>
              <span className="text-xs text-muted-foreground font-mono">{s.loops}× loops</span>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1">{s.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </div>

            <div>
              <p className={cn("text-3xl font-bold font-mono", s.color)}>{s.apyRange}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Projected APY</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-auto">
              <p className="text-xs text-muted-foreground">${s.minDeposit.toLocaleString()} min</p>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 gap-1 text-xs"
                onClick={() => onDeploy(s.loops, s.minDeposit)}
              >
                Simulate <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Risk disclosure */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-sm">
        <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-muted-foreground">
          <strong className="text-amber-300 block mb-1">Risk disclosure</strong>
          Looping amplifies both gains and losses. Positions can be liquidated if the health factor drops
          below 1.2×. The RiskManager contract auto-deleverages by 33% when approaching the threshold.
          Only deploy capital you can afford to have locked or liquidated.
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Loop() {
  const [tab, setTab] = useState<Tab>("simulator");
  // Shared state so Strategies tab can pre-fill Simulator
  const [presetLoops,   setPresetLoops]   = useState<number | null>(null);
  const [presetDeposit, setPresetDeposit] = useState<number | null>(null);

  function handleDeployPreset(loops: number, deposit: number) {
    setPresetLoops(loops);
    setPresetDeposit(deposit);
    setTab("simulator");
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "simulator", label: "Simulator",        icon: BarChart3   },
    { id: "positions", label: "Active Positions", icon: Layers      },
    { id: "strategies",label: "Strategies",       icon: Zap         },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Loop Engine</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Recursive MUSD loops via Morpho Alpha Vault — amplify yield with managed liquidation risk.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="info" size="sm">upMUSD · Morpho</Badge>
          <Badge variant="muted" size="sm">5× max</Badge>
        </div>
      </div>

      {/* Stats banner */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "Max APY (5× loop)",  value: "~110%", color: "text-primary" },
          { label: "Max Leverage",       value: "5×",    color: "text-foreground" },
          { label: "Min Health Factor",  value: "1.5×",  color: "text-emerald-400" },
          { label: "Auto-deleverage at", value: "1.2×",  color: "text-amber-400" },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="rounded-xl bg-black/40 border border-white/8 p-4 text-center"
          >
            <p className={cn("text-xl font-bold font-mono mb-1", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === id
                ? "bg-primary text-background shadow"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "simulator"  && <SimulatorTab  onSelectStrategy={handleDeployPreset} />}
      {tab === "positions"  && <PositionsTab />}
      {tab === "strategies" && <StrategiesTab onDeploy={handleDeployPreset} />}
    </div>
  );
}
