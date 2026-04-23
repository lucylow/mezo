/**
 * Contract verification script for Mezo explorer.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network mezoTestnet
 *
 * Required env vars:
 *   VAULT_ADDRESS            – deployed VeMEZOAutoCompounder address
 *   VEMEZO_ADDRESS           – IVeMEZO address on Mezo
 *   GAUGE_CONTROLLER_ADDRESS – IGaugeController address
 *   MEZO_TOKEN_ADDRESS       – MEZO ERC-20 address
 *   MUSD_TOKEN_ADDRESS       – MUSD ERC-20 address
 *   TREASURY_ADDRESS         – fee recipient
 *   TIGRIS_ROUTER_ADDRESS    – Tigris DEX router (for fee swap path)
 */

import hre from "hardhat";

async function main() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  if (!vaultAddress) throw new Error("VAULT_ADDRESS not set");

  const constructorArgs = [
    process.env.VEMEZO_ADDRESS           || "",
    process.env.GAUGE_CONTROLLER_ADDRESS || "",
    process.env.MEZO_TOKEN_ADDRESS       || "",
    process.env.MUSD_TOKEN_ADDRESS       || "",
    process.env.TREASURY_ADDRESS         || "",
    process.env.TIGRIS_ROUTER_ADDRESS    || "",
  ];

  if (constructorArgs.some(a => !a)) {
    throw new Error(
      "One or more constructor argument env vars missing. " +
      "Set VEMEZO_ADDRESS, GAUGE_CONTROLLER_ADDRESS, MEZO_TOKEN_ADDRESS, " +
      "MUSD_TOKEN_ADDRESS, TREASURY_ADDRESS, TIGRIS_ROUTER_ADDRESS.",
    );
  }

  console.log("Verifying VeMEZOAutoCompounder at", vaultAddress, "…");
  await hre.run("verify:verify", {
    address: vaultAddress,
    constructorArguments: constructorArgs,
  });
  console.log("Verification submitted successfully.");

  // Verify vault token (VeMEZOVaultToken is deployed by the vault constructor;
  // its address can be read from the deployed vault.)
  const vault = await hre.ethers.getContractAt("VeMEZOAutoCompounder", vaultAddress);
  const tokenAddress: string = await vault.vaultToken();

  console.log("Verifying VeMEZOVaultToken at", tokenAddress, "…");
  await hre.run("verify:verify", {
    address: tokenAddress,
    constructorArguments: [
      "Vault veMEZO Share",
      "vveMEZO",
      vaultAddress,
      process.env.MEZO_TOKEN_ADDRESS,
    ],
  });
  console.log("Token verification submitted successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
