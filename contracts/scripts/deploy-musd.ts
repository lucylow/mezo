/**
 * deploy-musd.ts
 *
 * Targeted deployment script for the MUSD integration layer:
 *   1. VeMEZOAutoCompounder   (full vault with Tigris swap path)
 *   2. TreasuryYieldManager   (multi-strategy MUSD treasury)
 *   3. Wires the two together on-chain
 *
 * Usage:
 *   npx hardhat run scripts/deploy-musd.ts --network mezoTestnet
 *
 * Required env vars (see .env.local.example):
 *   VEMEZO_ADDRESS, GAUGE_CONTROLLER_ADDRESS, MEZO_TOKEN_ADDRESS,
 *   MUSD_TOKEN_ADDRESS, TIGRIS_ROUTER_ADDRESS, MUSD_SAVINGS_VAULT_ADDRESS,
 *   TREASURY_ADDRESS (optional — falls back to deployer)
 */

import { ethers } from "hardhat";

const TIGRIS_ROUTER = "0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "BTC",
  );

  // ── Resolve addresses from env ───────────────────────────────────────────
  const VEMEZO           = required("VEMEZO_ADDRESS");
  const GAUGE            = required("GAUGE_CONTROLLER_ADDRESS");
  const MEZO_TOKEN       = required("MEZO_TOKEN_ADDRESS");
  const MUSD_TOKEN       = required("MUSD_TOKEN_ADDRESS");
  const TREASURY         = process.env.TREASURY_ADDRESS || deployer.address;
  const TIGRIS           = process.env.TIGRIS_ROUTER_ADDRESS  || TIGRIS_ROUTER;
  const MUSD_SAVINGS     = process.env.MUSD_SAVINGS_VAULT_ADDRESS || "";

  console.log("\n── Addresses ───────────────────────────────────────────────");
  console.log("veMEZO NFT:         ", VEMEZO);
  console.log("GaugeController:    ", GAUGE);
  console.log("MEZO token:         ", MEZO_TOKEN);
  console.log("MUSD token:         ", MUSD_TOKEN);
  console.log("Tigris router:      ", TIGRIS);
  console.log("MUSD Savings Vault: ", MUSD_SAVINGS || "(not set — auto-stake disabled)");
  console.log("Treasury:           ", TREASURY);

  // ── 1. Deploy VeMEZOAutoCompounder ───────────────────────────────────────
  console.log("\n── Step 1: Deploy VeMEZOAutoCompounder ─────────────────────");
  const VaultFactory = await ethers.getContractFactory("VeMEZOAutoCompounder");
  const vault = await VaultFactory.deploy(
    VEMEZO,
    GAUGE,
    MEZO_TOKEN,
    MUSD_TOKEN,
    TREASURY,
    TIGRIS,
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("VeMEZOAutoCompounder:", vaultAddress);
  console.log("VaultToken (vveMEZO):", await vault.vaultToken());

  // ── 2. Deploy TreasuryYieldManager ───────────────────────────────────────
  console.log("\n── Step 2: Deploy TreasuryYieldManager ─────────────────────");
  const YMFactory = await ethers.getContractFactory("TreasuryYieldManager");

  // TreasuryYieldManager needs a valid savings vault address to deploy.
  // If not provided we use a zero-address placeholder and wire it post-deploy.
  const savingsVaultForDeploy = MUSD_SAVINGS || ethers.ZeroAddress;
  const yieldManager = await YMFactory.deploy(MUSD_TOKEN, savingsVaultForDeploy, TREASURY);
  await yieldManager.waitForDeployment();
  const yieldManagerAddress = await yieldManager.getAddress();
  console.log("TreasuryYieldManager:", yieldManagerAddress);

  // ── 3. Wire MUSD Savings Vault into the main vault ───────────────────────
  if (MUSD_SAVINGS) {
    console.log("\n── Step 3: Configure MUSD Savings Vault ────────────────────");
    const tx = await vault.setMusdSavingsVault(MUSD_SAVINGS);
    await tx.wait();
    console.log("musdSavingsVault set to:", MUSD_SAVINGS);
  } else {
    console.log("\n── Step 3: Skipped (MUSD_SAVINGS_VAULT_ADDRESS not set) ────");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("DEPLOYMENT SUMMARY");
  console.log("════════════════════════════════════════════════════════════");
  console.log("VeMEZOAutoCompounder :", vaultAddress);
  console.log("VaultToken (vveMEZO) :", await vault.vaultToken());
  console.log("TreasuryYieldManager :", yieldManagerAddress);
  console.log("Tigris router        :", TIGRIS);
  console.log("MUSD token           :", MUSD_TOKEN);
  console.log("MUSD Savings Vault   :", MUSD_SAVINGS || "not configured");
  console.log("Treasury             :", TREASURY);
  console.log("\nUpdate .env.local.example / keeper .env with:");
  console.log(`  VAULT_ADDRESS=${vaultAddress}`);
  console.log(`  YIELD_MANAGER_ADDRESS=${yieldManagerAddress}`);
  console.log("════════════════════════════════════════════════════════════\n");
}

function required(envVar: string): string {
  const val = process.env[envVar];
  if (!val) throw new Error(`Missing required env var: ${envVar}`);
  return val;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
