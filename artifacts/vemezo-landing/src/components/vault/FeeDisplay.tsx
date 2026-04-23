import { useVaultStats } from "@/hooks/useVaultStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function FeeDisplay() {
  const { performanceFee, totalFeesCollected, tvl, projectedAPR } = useVaultStats();

  const feePct = performanceFee ?? 10;
  const apr = projectedAPR ?? 78;
  const estimatedAnnualFees = tvl * (apr / 100) * (feePct / 100);

  return (
    <Card className="bg-black/40 border-white/8">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Protocol fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>Performance fee</span>
          </div>
          <span className="font-semibold">{feePct}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span>Total fees collected</span>
          </div>
          <span className="font-semibold">{formatNumber(totalFeesCollected)} MUSD</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <PiggyBank className="h-4 w-4 text-yellow-400" />
            <span>Est. annual revenue</span>
          </div>
          <span className="font-semibold">~{formatNumber(estimatedAnnualFees)} MUSD</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          When Tigris routing is enabled, fees settle in MUSD and can auto-stake in the savings vault.
        </p>
      </CardContent>
    </Card>
  );
}
