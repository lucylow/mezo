import { useVaultStats } from "@/hooks/useVaultStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank, Percent, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function FeeDisplay() {
  const {
    performanceFee,
    totalFeesCollected,
    tvl,
    projectedAPR,
    treasuryMUSDValue,
    treasuryAPY,
  } = useVaultStats();

  const feePct = performanceFee ?? 10;
  const apr = projectedAPR ?? 78;
  const estimatedAnnualFees = tvl * (apr / 100) * (feePct / 100);
  const treasuryVal = treasuryMUSDValue ?? 0;
  const tAPY = treasuryAPY ?? 5;

  return (
    <Card className="bg-black/40 border-white/8">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          MUSD fee collection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Percent className="h-4 w-4 text-primary" />
            <span>Performance fee</span>
          </div>
          <span className="font-semibold">{feePct}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span>Total MUSD collected</span>
          </div>
          <span className="font-semibold">{formatNumber(totalFeesCollected)} MUSD</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <PiggyBank className="h-4 w-4 text-yellow-400" />
            <span>Treasury (sMUSD)</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatNumber(treasuryVal)} MUSD</div>
            <div className="text-xs text-green-400">+{tAPY}% base APY</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary/80" />
            <span>Est. annual revenue</span>
          </div>
          <span className="font-semibold">~{formatNumber(estimatedAnnualFees)} MUSD</span>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fees settle in{" "}
            <span className="text-primary font-medium">MUSD</span>—Mezo's Bitcoin‑backed
            stablecoin—and are auto‑staked in the{" "}
            <span className="text-primary font-medium">MUSD Savings Vault</span> for additional
            protocol yield via the sMUSD exchange rate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
