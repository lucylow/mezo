import { useState, useEffect, useCallback } from "react";

/** Returns the unix-millisecond timestamp of the next keeper run (Thursday 00:05 UTC). */
function nextEpochMs(): number {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilThursday,
    0, 5, 0, 0,
  );
}

const EPOCH_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function pad(n: number) { return String(n).padStart(2, "0"); }

export interface EpochTimerResult {
  /** Milliseconds remaining until the next epoch. */
  remaining: number;
  /** 0–100 — how far through the current 7-day epoch we are. */
  epochProgress: number;
  d: number;
  h: number;
  m: number;
  s: number;
  /** Pre-formatted "Xd Xh Xm Xs" string. */
  formatted: string;
  /** Pre-formatted "Xd HH:MM" compact string for sidebars. */
  compact: string;
}

/**
 * Shared hook for the 7-day epoch countdown and progress.
 * Ticks every second. Safe to mount in multiple components simultaneously.
 */
export function useEpochTimer(): EpochTimerResult {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, nextEpochMs() - Date.now()),
  );

  const tick = useCallback(() => {
    setRemaining(Math.max(0, nextEpochMs() - Date.now()));
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const d = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3_600);
  const m = Math.floor((totalSec % 3_600) / 60);
  const s = totalSec % 60;
  const epochProgress = Math.min(
    100,
    Math.round(((EPOCH_DURATION_MS - remaining) / EPOCH_DURATION_MS) * 100),
  );

  return {
    remaining,
    epochProgress,
    d, h, m, s,
    formatted: `${d}d ${h}h ${m}m ${s}s`,
    compact: `${d}d ${pad(h)}h ${pad(m)}m`,
  };
}
