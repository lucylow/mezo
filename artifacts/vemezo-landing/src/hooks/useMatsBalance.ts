import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

export const MATS_PER_DEPOSIT    = 500;
export const MATS_PER_COMPOUND   = 100;
export const MATS_PER_EXTENSION  = 250;
export const MATS_PER_SHARE_DAY  = 1;
export const SEASON2_MATS_RATE   = 36.78;  // mats per MEZO — Season 2 exchange rate
export const SEASON1_MATS_RATE   = 679.9;  // mats per MEZO — Season 1 exchange rate (closed)
export const REFERRAL_BONUS_PCT  = 5;      // 5% of referred user's Mats, lifetime

export interface MatsActivity {
  deposits:   number;
  compounds:  number;
  extensions: number;
  shareDays:  number;
}

export interface MatsBalance {
  totalMats:         number;
  activity:          MatsActivity;
  estimatedMEZO:     number;
  multiSeasonBonus:  boolean;
  bonusMats:         number;
  referrals:         number;
  referralMats:      number;
}

/**
 * Returns Mats balance for the connected wallet.
 * Currently uses mock data — replace queryFn with on-chain
 * MatsTracker.userActivity(address) call when contract is deployed.
 */
export function useMatsBalance() {
  const { address } = useAccount();

  return useQuery<MatsBalance | null>({
    queryKey: ["matsBalance", address],
    queryFn: async (): Promise<MatsBalance | null> => {
      if (!address) return null;

      // Mock activity for demo — driven by a simulated depositor
      // who has been in the vault for ~6 months (≈26 epochs)
      const activity: MatsActivity = {
        deposits:   2,    // 2 veMEZO NFTs deposited
        compounds:  26,   // 26 weekly auto-compound events
        extensions: 26,   // 26 weekly lock-extension events
        shareDays:  180,  // ~180 days of vault share holding
      };

      const baseMats =
        activity.deposits   * MATS_PER_DEPOSIT   +
        activity.compounds  * MATS_PER_COMPOUND  +
        activity.extensions * MATS_PER_EXTENSION +
        activity.shareDays  * MATS_PER_SHARE_DAY;

      const multiSeasonBonus = true; // this wallet participated in both seasons
      const bonusMats        = multiSeasonBonus ? Math.round(baseMats * 0.25) : 0;
      const totalMats        = baseMats + bonusMats;

      const referrals    = 3;
      const referralMats = 750; // ~5% of referred users' deposit Mats

      return {
        totalMats: totalMats + referralMats,
        activity,
        estimatedMEZO:    Math.round(totalMats / SEASON2_MATS_RATE),
        multiSeasonBonus,
        bonusMats,
        referrals,
        referralMats,
      };
    },
    enabled: !!address,
    staleTime: 60_000,
  });
}
