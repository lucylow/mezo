import { isAddress } from "viem";

/**
 * Contract addresses — populated from VITE_ env vars.
 * Default to zero address so hooks can detect "not yet deployed" and
 * fall back to the API / mock data without throwing.
 */
export const CONTRACTS = {
  VAULT:            (import.meta.env.VITE_VAULT_ADDRESS            || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  VEMEZO:           (import.meta.env.VITE_VEMEZO_ADDRESS           || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  GAUGE_CONTROLLER: (import.meta.env.VITE_GAUGE_CONTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  MEZO_TOKEN:       (import.meta.env.VITE_MEZO_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  MUSD_TOKEN:       (import.meta.env.VITE_MUSD_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  TREASURY_MANAGER: (import.meta.env.VITE_TREASURY_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  REFERRAL_MANAGER: (import.meta.env.VITE_REFERRAL_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

/** True when the vault has been deployed and has a real address. */
export function isContractDeployed(): boolean {
  return CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000" &&
         isAddress(CONTRACTS.VAULT);
}

export function isTreasuryManagerDeployed(): boolean {
  return CONTRACTS.TREASURY_MANAGER !== "0x0000000000000000000000000000000000000000" &&
         isAddress(CONTRACTS.TREASURY_MANAGER);
}

export function isReferralManagerDeployed(): boolean {
  return CONTRACTS.REFERRAL_MANAGER !== "0x0000000000000000000000000000000000000000" &&
         isAddress(CONTRACTS.REFERRAL_MANAGER);
}

export { VeMEZOVaultABI } from "./abis/VeMEZOVault";
export { VeMEZOABI }      from "./abis/VeMEZO";
export { TreasuryYieldManagerABI } from "./abis/TreasuryYieldManager";
export { ReferralManagerABI } from "./abis/ReferralManager";
