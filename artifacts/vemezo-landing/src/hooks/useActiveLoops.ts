import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

export interface LoopPosition {
  id:          string;
  strategy:    string;
  description: string;
  collateral:  number;  // total upMUSD collateral (USD)
  debt:        number;  // total MUSD borrowed
  netEquity:   number;  // collateral - debt
  healthFactor:number;
  apy:         number;  // annualised net yield %
  loops:       number;
  createdAt:   string;
}

/**
 * Returns the connected wallet's active loop positions.
 * Mock data — replace queryFn body with:
 *   const pos = await looperContract.read.userPositions([address]);
 * when Looper.sol is deployed.
 */
export function useActiveLoops() {
  const { address } = useAccount();

  return useQuery<LoopPosition[]>({
    queryKey: ["activeLoops", address],
    queryFn: async (): Promise<LoopPosition[]> => {
      if (!address) return [];

      return [
        {
          id:          "loop-001",
          strategy:    "MUSD Power Loop",
          description: "upMUSD → Morpho Alpha → 4× loop",
          collateral:  45_200,
          debt:        28_400,
          netEquity:   16_800,
          healthFactor: 1.82,
          apy:         58.2,
          loops:       4,
          createdAt:   "2026-04-12",
        },
      ];
    },
    enabled:   !!address,
    staleTime: 30_000,
  });
}
