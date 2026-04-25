import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";

/**
 * EpochTimer — shows countdown to the next Mezo epoch boundary.
 *
 * Mezo epochs:  7-day cycle, starting Thursday 00:00 UTC.
 * The keeper compound+vote cron runs at Thursday 00:05 UTC.
 */

function getNextEpochMs(): number {
  const now    = new Date();
  const day    = now.getUTCDay();          // 0=Sun … 4=Thu
  const daysUntilThursday = (4 - day + 7) % 7 || 7; // next Thursday
  const nextThursday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilThursday,
    0, 5, 0, 0,                            // 00:05 UTC
  ));
  return nextThursday.getTime();
}

function formatDuration(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function EpochTimer() {
  const [remaining, setRemaining] = useState(() => getNextEpochMs() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(getNextEpochMs() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { d, h, m, s } = formatDuration(remaining);
  const epochPct = 100 - (remaining / (7 * 24 * 60 * 60 * 1000)) * 100;

  return (
    <Card className="bg-black/40 border-white/8">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Next Epoch (Thu 00:05 UTC)
          </span>
          <RefreshCw className="h-3 w-3 text-muted-foreground/40 ml-auto" />
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-2xl font-bold text-white">{d}d</span>
          <span className="text-xl font-bold text-white/70">{pad(h)}h</span>
          <span className="text-xl font-bold text-white/70">{pad(m)}m</span>
          <span className="text-xl font-bold text-white/50">{pad(s)}s</span>
        </div>

        <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: `${Math.min(epochPct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1.5">
          Keeper auto-compounds & recasts gauge votes at epoch boundary
        </p>
      </CardContent>
    </Card>
  );
}
