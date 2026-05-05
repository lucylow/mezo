import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, TrendingUp, Lock, ArrowRight, ExternalLink, Shield, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Strategy {
  id: string;
  title: string;
  description: string;
  apr: number;
  tvl: string;
  risk: "Low" | "Medium" | "High";
  icon: React.ElementType;
  action: string;
  href: string;
  featured?: boolean;
}

const STRATEGIES: Strategy[] = [
  {
    id: "vemezo-compounder",
    title: "veMEZO Auto-Compounder",
    description: "Automatically compound veMEZO rebase rewards and gauge incentives every epoch.",
    apr: 85.5,
    tvl: "$12.45M",
    risk: "Low",
    icon: Zap,
    action: "Deposit",
    href: "/vault",
    featured: true,
  },
  {
    id: "musd-power-loop",
    title: "MUSD Power Loop",
    description: "Recursive upMUSD → Morpho Alpha → 4× loop. Amplified yield with managed liquidation risk.",
    apr: 58.2,
    tvl: "$4.1M",
    risk: "Medium",
    icon: Layers,
    action: "Open Loop",
    href: "/loop",
  },
  {
    id: "musd-savings",
    title: "MUSD Savings Vault",
    description: "Earn yield on MUSD with fee-backed revenue and MEZO emissions.",
    apr: 109.08,
    tvl: "$8.9M",
    risk: "Low",
    icon: TrendingUp,
    action: "Deposit",
    href: "https://mezo.org/earn",
  },
  {
    id: "btc-lending",
    title: "BTC Lending",
    description: "Lend BTC and earn interest paid by borrowers on the Mezo layer.",
    apr: 4.2,
    tvl: "$45M",
    risk: "Low",
    icon: Lock,
    action: "Lend",
    href: "https://mezo.org/lend",
  },
  {
    id: "alpha-conservative",
    title: "Alpha Conservative Loop",
    description: "aMUSD Morpho core vault → 2× safe loop. Low liquidation risk, steady amplified returns.",
    apr: 28.5,
    tvl: "$1.8M",
    risk: "Low",
    icon: Layers,
    action: "Open Loop",
    href: "/loop",
  },
  {
    id: "mezo-lp",
    title: "MEZO-MUSD LP",
    description: "Provide liquidity and earn trading fees plus MEZO emissions.",
    apr: 45.8,
    tvl: "$3.2M",
    risk: "Medium",
    icon: TrendingUp,
    action: "Add Liquidity",
    href: "https://aerodrome.finance",
  },
];

const RISK_STYLE: Record<string, string> = {
  Low: "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  High: "text-red-400 bg-red-400/10 border-red-400/20",
};

const TABS = ["All Strategies", "Vaults", "Lending", "Liquidity"];

export default function Earn() {
  const [tab, setTab] = useState("All Strategies");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Earn</h1>
        <p className="text-muted-foreground">Explore yield strategies and grow your Bitcoin-native assets.</p>
      </div>

      {/* Featured banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider font-mono mb-1">Featured Strategy</p>
              <h3 className="text-xl font-bold">veMEZO Auto-Compounder</h3>
              <p className="text-muted-foreground text-sm mt-0.5">Our flagship yield optimizer for veMEZO holders</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold text-primary">85.5% APR</span>
                <span className="text-sm text-muted-foreground">$12.45M TVL</span>
                <span className="text-xs px-2 py-0.5 rounded-full border text-green-400 border-green-400/20 bg-green-400/10">Low Risk</span>
              </div>
            </div>
          </div>
          <Link href="/vault">
            <Button size="lg" className="shrink-0">
              Start Earning <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm transition",
              tab === t ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Strategy grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {STRATEGIES.map((s) => {
          const Icon = s.icon;
          const isExternal = s.href.startsWith("http");
          return (
            <Card key={s.id} className={cn(
              "bg-black/40 border-white/8 hover:border-primary/30 transition",
              s.featured && "ring-1 ring-primary/20",
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.description}</p>
                    </div>
                  </div>
                  <span className={cn("ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full border", RISK_STYLE[s.risk])}>
                    {s.risk}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold">{s.apr}%</p>
                    <p className="text-xs text-muted-foreground">APR</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{s.tvl}</p>
                    <p className="text-xs text-muted-foreground">TVL</p>
                  </div>
                </div>
                {isExternal ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full border-white/10">
                      {s.action} <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                ) : (
                  <Link href={s.href}>
                    <Button className="w-full">{s.action}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
        <Shield className="h-5 w-5 text-primary/60 mt-0.5 shrink-0" />
        <p>All strategies on veMEZO.fi have been reviewed by the Mezo security team. External strategies link to third-party protocols — always DYOR.</p>
      </div>
    </div>
  );
}
