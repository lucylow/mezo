import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { useUserPosition } from "@/hooks/useUserPosition";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useWallet } from "@/hooks/useWallet";
import { Lock, TrendingUp, Layers, Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function PositionOverview() {
  const { address }     = useAccount();
  const { isConnected } = useWallet();
  const position        = useUserPosition();
  const stats           = useVaultStats();

  const poolShare = isConnected && stats.totalShares > 0
    ? ((position.shares / stats.totalShares) * 100)
    : 0;

  const estimatedValue = isConnected
    ? position.shares * (stats.tvl / Math.max(stats.totalShares, 1))
    : 0;

  const items = [
    {
      icon:  <Layers className="w-4 h-4 text-primary" />,
      label: "vveMEZO Balance",
      value: isConnected ? <AnimatedNumber value={position.shares} decimals={2} /> : "—",
      sub:   "vault shares",
    },
    {
      icon:  <Coins className="w-4 h-4 text-yellow-400" />,
      label: "Estimated Value",
      value: isConnected ? `${formatNumber(estimatedValue)} MEZO` : "—",
      sub:   `pool share: ${poolShare.toFixed(3)}%`,
    },
    {
      icon:  <Lock className="w-4 h-4 text-blue-400" />,
      label: "NFTs in Vault",
      value: isConnected ? position.nftsLocked.length : "—",
      sub:   "deposited tokens",
    },
    {
      icon:  <TrendingUp className="w-4 h-4 text-green-400" />,
      label: "Projected APR",
      value: `${stats.projectedAPR}%`,
      sub:   `net of ${stats.performanceFee}% fee`,
    },
  ];

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Your Position</CardTitle>
          {isConnected && address && (
            <Badge variant="outline" className="text-xs font-mono border-white/20 text-muted-foreground">
              {address.slice(0, 6)}…{address.slice(-4)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Connect your wallet to view your position.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-lg font-bold font-mono leading-none">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
