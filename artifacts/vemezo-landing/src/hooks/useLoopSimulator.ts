import { useState, useMemo } from "react";

// ── Constants from research document ─────────────────────────────────────────
// LTV decreases per loop to stay conservative: 70% → 65% → 60% → 55% → 50%
const LTV_PER_LOOP  = [0.70, 0.65, 0.60, 0.55, 0.50] as const;
const SUPPLY_APY    = 0.30;  // 30% upMUSD / Upshift vault APY
const BORROW_RATE   = 0.01;  // 1% Morpho borrow rate on MUSD
const LIQ_THRESHOLD = 0.85;  // 85% Morpho liquidation threshold

export const MAX_LOOPS    = 5;
export const MIN_DEPOSIT  = 1_000;

export interface IterationStep {
  loop:                  number;
  ltv:                   number;
  inputCollateral:       number; // MUSD deposited this iteration
  borrowed:              number; // MUSD borrowed from Morpho
  cumulativeCollateral:  number;
  cumulativeDebt:        number;
}

export interface LoopResult {
  initialDeposit:     number;
  loops:              number;
  totalCollateral:    number;
  totalDebt:          number;
  netEquity:          number;
  positionMultiple:   number; // e.g. 2.5x
  projectedAPY:       number; // % annualised, net of borrow
  grossAPY:           number;
  borrowCostAPY:      number;
  healthFactor:       number;
  liquidationBuffer:  number; // % drop before liquidation
  riskLevel:          "safe" | "warning" | "danger";
  iterationBreakdown: IterationStep[];
}

function computeLoop(deposit: number, loops: number): LoopResult {
  let currentIn    = deposit;
  let totalCollat  = deposit;
  let totalDebt    = 0;
  const breakdown: IterationStep[] = [];

  for (let i = 0; i < loops; i++) {
    const ltv      = LTV_PER_LOOP[i] ?? LTV_PER_LOOP[LTV_PER_LOOP.length - 1];
    const borrowed = currentIn * ltv;

    totalCollat += borrowed;
    totalDebt   += borrowed;

    breakdown.push({
      loop:                 i + 1,
      ltv,
      inputCollateral:      currentIn,
      borrowed,
      cumulativeCollateral: totalCollat,
      cumulativeDebt:       totalDebt,
    });

    currentIn = borrowed; // next iteration re-deposits the borrowed amount
  }

  const grossYield   = SUPPLY_APY * totalCollat;
  const borrowCost   = BORROW_RATE * totalDebt;
  const netYield     = grossYield - borrowCost;
  const projectedAPY = (netYield / deposit) * 100;
  const grossAPY     = (grossYield / deposit) * 100;
  const borrowAPY    = (borrowCost / deposit) * 100;

  const healthFactor = totalDebt > 0
    ? (totalCollat * LIQ_THRESHOLD) / totalDebt
    : 99;

  const liquidationBuffer = totalDebt > 0
    ? Math.max(0, ((healthFactor - 1) / healthFactor) * 100)
    : 100;

  const riskLevel: LoopResult["riskLevel"] =
    healthFactor > 2.0 ? "safe" :
    healthFactor > 1.5 ? "warning" :
    "danger";

  return {
    initialDeposit:    deposit,
    loops,
    totalCollateral:   totalCollat,
    totalDebt,
    netEquity:         totalCollat - totalDebt,
    positionMultiple:  totalCollat / deposit,
    projectedAPY,
    grossAPY,
    borrowCostAPY:     borrowAPY,
    healthFactor,
    liquidationBuffer,
    riskLevel,
    iterationBreakdown: breakdown,
  };
}

export function useLoopSimulator() {
  const [deposit, setDeposit] = useState(10_000);
  const [loops,   setLoops]   = useState(3);

  const result = useMemo(() => computeLoop(deposit, loops), [deposit, loops]);

  return { deposit, setDeposit, loops, setLoops, result };
}
