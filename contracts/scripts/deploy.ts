import hre, { ethers } from "hardhat";

/**
 * Simple deployment script for VeMEZOAutoCompounder.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network mezoTestnet
 *
 * Required env vars:
 *   VEMEZO_ADDRESS, GAUGE_CONTROLLER_ADDRESS, MEZO_TOKEN_ADDRESS,
 *   MUSD_TOKEN_ADDRESS, TREASURY_ADDRESS, TIGRIS_ROUTER_ADDRESS
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BTC");

  const VEMEZO_ADDRESS           = process.env.VEMEZO_ADDRESS           || "0x0000000000000000000000000000000000000000";
  const GAUGE_CONTROLLER_ADDRESS = process.env.GAUGE_CONTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const MEZO_TOKEN_ADDRESS       = process.env.MEZO_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const MUSD_TOKEN_ADDRESS       = process.env.MUSD_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const TREASURY_ADDRESS         = process.env.TREASURY_ADDRESS         || deployer.address;
  const TIGRIS_ROUTER_ADDRESS    = process.env.TIGRIS_ROUTER_ADDRESS    || "0x0000000000000000000000000000000000000000";

  console.log("\nDeploying VeMEZOAutoCompounder...");
  const VeMEZOAutoCompounder = await ethers.getContractFactory("VeMEZOAutoCompounder");
  const vault = await VeMEZOAutoCompounder.deploy(
    VEMEZO_ADDRESS,
    GAUGE_CONTROLLER_ADDRESS,
    MEZO_TOKEN_ADDRESS,
    MUSD_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    TIGRIS_ROUTER_ADDRESS,
  );

  await vault.waitForDeployment();
  const vaultAddress      = await vault.getAddress();
  const vaultTokenAddress = await vault.vaultToken();

  console.log("VeMEZOAutoCompounder deployed to:", vaultAddress);
  console.log("VaultToken (vveMEZO) deployed to:", vaultTokenAddress);

  console.log("\nVerifying on Mezo explorer...");
  try {
    await hre.run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [
        VEMEZO_ADDRESS,
        GAUGE_CONTROLLER_ADDRESS,
        MEZO_TOKEN_ADDRESS,
        MUSD_TOKEN_ADDRESS,
        TREASURY_ADDRESS,
        TIGRIS_ROUTER_ADDRESS,
      ],
    });
    console.log("Vault verified.");

    await hre.run("verify:verify", {
      address: vaultTokenAddress,
      constructorArguments: [
        "Vault veMEZO Share",
        "vveMEZO",
        vaultAddress,
        MEZO_TOKEN_ADDRESS,
      ],
    });
    console.log("VaultToken verified.");
  } catch (e: any) {
    console.warn("Verification skipped:", e.message);
  }

  console.log("\nDone. Set these in your .env:");
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
  console.log(`VAULT_TOKEN_ADDRESS=${vaultTokenAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
