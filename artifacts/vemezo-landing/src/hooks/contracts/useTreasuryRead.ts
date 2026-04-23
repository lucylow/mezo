import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, TreasuryYieldManagerABI, isTreasuryManagerDeployed } from "@/lib/contracts";

export interface StrategySlice {
  name: string;
  allocation: number;
  apy: number;
}

/**
 * Reads TreasuryYieldManager allocation and notional TVL (MUSD-denominated).
 */
export function useTreasuryStats() {
  const deployed = isTreasuryManagerDeployed();

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.TREASURY_MANAGER,
        abi: TreasuryYieldManagerABI,
        functionName: "getTotalValue",
      },
      {
        address: CONTRACTS.TREASURY_MANAGER,
        abi: TreasuryYieldManagerABI,
        functionName: "allocation",
      },
    ],
    query: { enabled: deployed },
  });

  const totalValue = data?.[0]?.result as bigint | undefined;
  const allocation = data?.[1]?.result as
    | { savingsVault: bigint; curvePool: bigint; aerodromePool: bigint; idle: bigint }
    | undefined;

  const strategyAllocation: StrategySlice[] = allocation
    ? [
        { name: "MUSD Savings", allocation: Number(allocation.savingsVault) / 100, apy: 8.5 },
        { name: "Curve MUSD/sUSDe", allocation: Number(allocation.curvePool) / 100, apy: 15.2 },
        { name: "Aerodrome MUSD/USDC", allocation: Number(allocation.aerodromePool) / 100, apy: 22 },
      ]
    : [];

  const treasuryAPY = strategyAllocation.reduce(
    (acc, s) => acc + (s.allocation / 100) * s.apy,
    0,
  );

  return {
    treasuryValue: totalValue ? Number(formatEther(totalValue)) : 0,
    treasuryAPY,
    strategyAllocation,
    isLoading: deployed ? isLoading : false,
    deployed,
  };
}
