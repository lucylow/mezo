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
} as const;

/** True when the vault has been deployed and has a real address. */
export function isContractDeployed(): boolean {
  return CONTRACTS.VAULT !== "0x0000000000000000000000000000000000000000" &&
         isAddress(CONTRACTS.VAULT);
}

export { VeMEZOVaultABI } from "./abis/VeMEZOVault";
export { VeMEZOABI }      from "./abis/VeMEZO";
