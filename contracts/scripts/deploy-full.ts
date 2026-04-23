import { ethers } from "hardhat";

/**
 * Full decentralized deployment script.
 *
 * Deploys:
 *   1. VeMEZOAutoCompounder (vault)
 *   2. VaultTimelockController (2-day delay)
 *   3. VaultGovernor (vveMEZO voting token)
 *   4. GelatoCompounder (decentralized keeper)
 *   5. Transfers vault ownership → Timelock
 *   6. Grants Governor proposer/executor roles on Timelock
 *
 * Usage:
 *   npx hardhat run scripts/deploy-full.ts --network mezoTestnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== veMEZO Auto-Compounder — Full Decentralized Deployment ===");
  console.log("Deployer :", deployer.address);
  console.log("Balance  :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BTC\n");

  // ── External contract addresses ───────────────────────────────────────────
  const VEMEZO_ADDRESS           = process.env.VEMEZO_ADDRESS           || "0x0000000000000000000000000000000000000000";
  const GAUGE_CONTROLLER_ADDRESS = process.env.GAUGE_CONTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const MEZO_TOKEN_ADDRESS       = process.env.MEZO_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const MUSD_TOKEN_ADDRESS       = process.env.MUSD_TOKEN_ADDRESS       || "0x0000000000000000000000000000000000000000";
  const TREASURY_ADDRESS         = process.env.TREASURY_ADDRESS         || deployer.address;
  const TIGRIS_ROUTER_ADDRESS    = process.env.TIGRIS_ROUTER_ADDRESS    || "0x0000000000000000000000000000000000000000";
  // Gelato Automate address on the target chain (set to zero address to skip task creation)
  const GELATO_AUTOMATE_ADDRESS  = process.env.GELATO_AUTOMATE_ADDRESS  || "0x0000000000000000000000000000000000000000";

  // ── 1. Deploy Vault ───────────────────────────────────────────────────────
  console.log("1. Deploying VeMEZOAutoCompounder...");
  const VaultFactory = await ethers.getContractFactory("VeMEZOAutoCompounder");
  const vault = await VaultFactory.deploy(
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
  console.log("   VeMEZOAutoCompounder :", vaultAddress);
  console.log("   vveMEZO (VaultToken) :", vaultTokenAddress);

  // ── 2. Deploy Timelock ────────────────────────────────────────────────────
  console.log("\n2. Deploying VaultTimelockController (2-day delay)...");
  const minDelay  = 2 * 24 * 60 * 60; // 2 days
  const proposers: string[] = [];      // Governor will be granted the role after deploy
  const executors: string[] = [];
  const admin     = deployer.address;

  const TimelockFactory = await ethers.getContractFactory("VaultTimelockController");
  const timelock = await TimelockFactory.deploy(minDelay, proposers, executors, admin);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("   VaultTimelockController:", timelockAddress);

  // ── 3. Deploy Governor ────────────────────────────────────────────────────
  console.log("\n3. Deploying VaultGovernor...");
  const SECONDS_PER_BLOCK = 12;
  const votingDelay       = Math.floor(1  * 86400 / SECONDS_PER_BLOCK); // ~1 day
  const votingPeriod      = Math.floor(5  * 86400 / SECONDS_PER_BLOCK); // ~5 days
  const proposalThreshold = ethers.parseEther("10000");                  // 10 000 vveMEZO
  const quorumAmount      = ethers.parseEther("100000");                 // 100 000 vveMEZO

  const GovernorFactory = await ethers.getContractFactory("VaultGovernor");
  const governor = await GovernorFactory.deploy(
    vaultTokenAddress,
    timelockAddress,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumAmount,
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("   VaultGovernor:", governorAddress);

  // ── 4. Deploy Gelato Compounder ───────────────────────────────────────────
  console.log("\n4. Deploying GelatoCompounder...");
  let gelatoCompounderAddress = "skipped (no GELATO_AUTOMATE_ADDRESS)";
  if (GELATO_AUTOMATE_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    const GelatoFactory = await ethers.getContractFactory("GelatoCompounder");
    const gelatoCompounder = await GelatoFactory.deploy(vaultAddress, GELATO_AUTOMATE_ADDRESS);
    await gelatoCompounder.waitForDeployment();
    gelatoCompounderAddress = await gelatoCompounder.getAddress();
    console.log("   GelatoCompounder:", gelatoCompounderAddress);

    // Authorise as keeper
    await vault.updateKeeper(gelatoCompounderAddress);
    console.log("   Keeper updated → GelatoCompounder");
  } else {
    console.log("   Skipped (set GELATO_AUTOMATE_ADDRESS to deploy)");
  }

  // ── 5. Wire governance ────────────────────────────────────────────────────
  console.log("\n5. Configuring governance roles...");

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  await timelock.grantRole(PROPOSER_ROLE,  governorAddress);
  await timelock.grantRole(EXECUTOR_ROLE,  governorAddress);
  await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  console.log("   Governor granted PROPOSER, EXECUTOR, CANCELLER roles on Timelock");

  // Transfer vault ownership to timelock so governance controls admin fns
  await vault.transferOwnership(timelockAddress);
  console.log("   Vault ownership transferred → Timelock");

  // Renounce deployer's admin role on timelock (full decentralisation)
  // Uncomment when ready for production:
  // await timelock.renounceRole(await timelock.DEFAULT_ADMIN_ROLE(), deployer.address);

  // ── 6. Summary ────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Complete ===");
  console.log("VeMEZOAutoCompounder :", vaultAddress);
  console.log("vveMEZO (VaultToken) :", vaultTokenAddress);
  console.log("VaultTimelockController:", timelockAddress);
  console.log("VaultGovernor        :", governorAddress);
  console.log("GelatoCompounder     :", gelatoCompounderAddress);
  console.log("");
  console.log("Next steps:");
  console.log("  • Verify contracts on Mezo explorer");
  console.log("  • Create Gelato task: gelatoCompounder.createTask()");
  console.log("  • Fund Gelato task with native BTC for fee payment");
  console.log("  • Update VITE_* env vars in the frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
