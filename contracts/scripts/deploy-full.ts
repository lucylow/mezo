import hre, { ethers } from "hardhat";

/**
 * Full decentralized deployment script.
 *
 * Deploys:
 *   1. VeMEZOAutoCompounder (vault + vveMEZO token)
 *   2. VaultTimelockController (2-day delay)
 *   3. VaultGovernor (vveMEZO-powered governance)
 *   4. TreasuryYieldManager (MUSD yield routing)
 *   5. GelatoCompounder (decentralized keeper — optional)
 *   6. Wires governance roles and transfers vault ownership to timelock
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
  const MUSD_SAVINGS_VAULT_ADDR  = process.env.MUSD_SAVINGS_VAULT       || "0x0000000000000000000000000000000000000000";
  const TREASURY_ADDRESS         = process.env.TREASURY_ADDRESS         || deployer.address;
  const TIGRIS_ROUTER_ADDRESS    = process.env.TIGRIS_ROUTER_ADDRESS    || "0x0000000000000000000000000000000000000000";
  // Set to non-zero to enable GelatoCompounder deployment
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
  const proposers: string[] = [];      // Governor granted the role below
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

  // ── 4. Deploy TreasuryYieldManager ───────────────────────────────────────
  console.log("\n4. Deploying TreasuryYieldManager...");
  let treasuryManagerAddress = "skipped (no MUSD_SAVINGS_VAULT)";
  if (MUSD_SAVINGS_VAULT_ADDR !== "0x0000000000000000000000000000000000000000") {
    const TreasuryFactory = await ethers.getContractFactory("TreasuryYieldManager");
    const treasuryManager = await TreasuryFactory.deploy(
      MUSD_TOKEN_ADDRESS,
      MUSD_SAVINGS_VAULT_ADDR,
      timelockAddress,   // timelock is the owner so governance controls treasury
    );
    await treasuryManager.waitForDeployment();
    treasuryManagerAddress = await treasuryManager.getAddress();
    console.log("   TreasuryYieldManager:", treasuryManagerAddress);
  } else {
    console.log("   Skipped (set MUSD_SAVINGS_VAULT to deploy)");
  }

  // ── 5. Deploy GelatoCompounder (optional) ─────────────────────────────────
  console.log("\n5. Deploying GelatoCompounder...");
  let gelatoCompounderAddress = "skipped (no GELATO_AUTOMATE_ADDRESS)";
  if (GELATO_AUTOMATE_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    const GelatoFactory = await ethers.getContractFactory("GelatoCompounder");
    const gelatoCompounder = await GelatoFactory.deploy(vaultAddress, GELATO_AUTOMATE_ADDRESS);
    await gelatoCompounder.waitForDeployment();
    gelatoCompounderAddress = await gelatoCompounder.getAddress();
    console.log("   GelatoCompounder:", gelatoCompounderAddress);

    await vault.updateKeeper(gelatoCompounderAddress);
    console.log("   Keeper updated → GelatoCompounder");
  } else {
    console.log("   Skipped (set GELATO_AUTOMATE_ADDRESS to deploy)");
  }

  // ── 6. Wire governance ────────────────────────────────────────────────────
  console.log("\n6. Configuring governance roles...");

  const PROPOSER_ROLE  = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE  = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  await timelock.grantRole(PROPOSER_ROLE,  governorAddress);
  await timelock.grantRole(EXECUTOR_ROLE,  governorAddress);
  await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  console.log("   Governor granted PROPOSER, EXECUTOR, CANCELLER roles on Timelock");

  // Transfer vault ownership to timelock so governance controls admin functions
  await vault.transferOwnership(timelockAddress);
  console.log("   Vault ownership transferred → Timelock (pending acceptance)");

  // ── 7. Verify all contracts ───────────────────────────────────────────────
  console.log("\n7. Verifying contracts on Mezo explorer...");
  const verifications: Array<{ address: string; args: unknown[]; name: string }> = [
    { name: "VeMEZOAutoCompounder", address: vaultAddress,   args: [VEMEZO_ADDRESS, GAUGE_CONTROLLER_ADDRESS, MEZO_TOKEN_ADDRESS, MUSD_TOKEN_ADDRESS, TREASURY_ADDRESS, TIGRIS_ROUTER_ADDRESS] },
    { name: "VeMEZOVaultToken",     address: vaultTokenAddress, args: ["Vault veMEZO Share", "vveMEZO", vaultAddress, MEZO_TOKEN_ADDRESS] },
    { name: "VaultTimelockController", address: timelockAddress, args: [minDelay, proposers, executors, admin] },
    { name: "VaultGovernor",        address: governorAddress, args: [vaultTokenAddress, timelockAddress, votingDelay, votingPeriod, proposalThreshold, quorumAmount] },
  ];

  for (const v of verifications) {
    try {
      await hre.run("verify:verify", { address: v.address, constructorArguments: v.args });
      console.log(`   ${v.name} verified.`);
    } catch (e: any) {
      console.warn(`   ${v.name} verification skipped:`, e.message?.split("\n")[0]);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Complete ===");
  console.log(`VeMEZOAutoCompounder    : ${vaultAddress}`);
  console.log(`vveMEZO (VaultToken)    : ${vaultTokenAddress}`);
  console.log(`VaultTimelockController : ${timelockAddress}`);
  console.log(`VaultGovernor           : ${governorAddress}`);
  console.log(`TreasuryYieldManager    : ${treasuryManagerAddress}`);
  console.log(`GelatoCompounder        : ${gelatoCompounderAddress}`);
  console.log("\nNext steps:");
  console.log("  • Call timelock.acceptOwnership() from the vault to complete ownership transfer");
  console.log("  • If GelatoCompounder deployed: call gelatoCompounder.createTask()");
  console.log("  • Fund the Gelato task with native BTC for fee payment");
  console.log("  • Set VITE_VAULT_ADDRESS and VITE_VAULT_TOKEN_ADDRESS in the frontend .env");
  console.log("  • Update subgraph/subgraph.yaml contract addresses and re-deploy to Goldsky");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
