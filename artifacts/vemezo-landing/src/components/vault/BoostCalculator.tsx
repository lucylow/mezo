import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * veMEZO Boost Calculator
 *
 * veMEZO amplifies veBTC-based gauge weight. The boost formula used in Mezo:
 *   effective_weight = base_weight * (1 + min(veMEZO_balance / veBTC_balance, 1.0) * MAX_BOOST_MULTIPLIER)
 *
 * Max boost multiplier is 2.5x (similar to Curve veCRV model).
 * This calculator illustrates how increasing veMEZO lock duration amplifies yield.
 */

const MAX_LOCK_WEEKS   = 208; // 4 years in weeks
const MAX_BOOST_MULT   = 2.5;
const BASE_APR         = 78;  // base vault APR without boost

function calcBoostMultiplier(lockWeeks: number): number {
  if (lockWeeks <= 0) return 1;
  const fraction = Math.min(lockWeeks / MAX_LOCK_WEEKS, 1);
  return 1 + fraction * (MAX_BOOST_MULT - 1);
}

function calcBoostedAPR(lockWeeks: number): number {
  return BASE_APR * calcBoostMultiplier(lockWeeks);
}

export function BoostCalculator() {
  const [lockWeeks, setLockWeeks] = useState<number>(52);

  const boost   = calcBoostMultiplier(lockWeeks);
  const boosted = calcBoostedAPR(lockWeeks);
  const lockYears = (lockWeeks / 52).toFixed(1);

  const boostColor =
    boost >= 2.2 ? "text-green-400" :
    boost >= 1.5 ? "text-yellow-400" :
    "text-muted-foreground";

  return (
    <Card className="bg-black/40 border-white/8">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          veMEZO Boost Calculator
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 ml-1" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Longer lock durations increase your veMEZO balance, amplifying gauge weight
              and boosting your share of incentive rewards. Max 2.5× boost at 4-year lock.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lock duration</span>
            <span className="font-mono font-bold text-white">
              {lockWeeks}w <span className="text-muted-foreground font-normal">({lockYears} yrs)</span>
            </span>
          </div>
          <Slider
            min={1}
            max={MAX_LOCK_WEEKS}
            step={1}
            value={[lockWeeks]}
            onValueChange={([v]) => setLockWeeks(v)}
            className="[&_[role=slider]]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground/50">
            <span>1 week</span>
            <span>4 years (max)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Boost Multiplier</p>
            <p className={`text-2xl font-bold font-mono ${boostColor}`}>
              {boost.toFixed(2)}×
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Effective APR</p>
            <p className="text-2xl font-bold font-mono text-primary">
              {boosted.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-muted-foreground">
          The vault auto-extends lock to max duration each compound, ensuring you always
          receive the <span className="text-primary font-medium">maximum 2.5× boost</span> on
          all deposited positions.
        </div>
      </CardContent>
    </Card>
  );
}
