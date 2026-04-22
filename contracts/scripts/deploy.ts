import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BTC");

  // ── Contract addresses (update after @mezo-org/euphrates-contracts ships) ──
  const VEMEZO_ADDRESS           = process.env.VEMEZO_ADDRESS           || "0x0000000000000000000000000000000000000000";
  const GAUGE_CONTROLLER_ADDRESS = process.env.GAUGE_CONTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const MEZO_TOKEN_ADDRESS       = process.env.MEZO_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const MUSD_TOKEN_ADDRESS       = process.env.MUSD_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const TREASURY_ADDRESS         = process.env.TREASURY_ADDRESS         || deployer.address;

  console.log("\nDeploying VeMEZOAutoCompounder...");
  const VeMEZOAutoCompounder = await ethers.getContractFactory("VeMEZOAutoCompounder");
  const vault = await VeMEZOAutoCompounder.deploy(
    VEMEZO_ADDRESS,
    GAUGE_CONTROLLER_ADDRESS,
    MEZO_TOKEN_ADDRESS,
    MUSD_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("VeMEZOAutoCompounder deployed to:", vaultAddress);

  const vaultTokenAddress = await vault.vaultToken();
  console.log("VaultToken (vveMEZO) deployed to:", vaultTokenAddress);

  console.log("\nVerifying on Mezo explorer...");
  try {
    await (hre as any).run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [
        VEMEZO_ADDRESS,
        GAUGE_CONTROLLER_ADDRESS,
        MEZO_TOKEN_ADDRESS,
        MUSD_TOKEN_ADDRESS,
        TREASURY_ADDRESS,
      ],
    });
    console.log("Verified!");
  } catch (e: any) {
    console.warn("Verification skipped:", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
