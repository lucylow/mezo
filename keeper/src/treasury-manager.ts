import { ethers } from "ethers";
import "dotenv/config";

const TREASURY_MANAGER_ADDRESS = process.env.TREASURY_MANAGER_ADDRESS ?? "";
const MUSD_TOKEN = process.env.MUSD_TOKEN ?? "";

const TREASURY_MANAGER_ABI = ["function deployTreasury(uint256 totalAmount) external"];

/**
 * Deploy idle MUSD held by TreasuryYieldManager according to on-chain allocation.
 * Intended to run weekly after fee collection (cron or Defender).
 */
export async function deployTreasury(): Promise<void> {
  if (!TREASURY_MANAGER_ADDRESS || !MUSD_TOKEN) {
    console.warn("[treasury-manager] TREASURY_MANAGER_ADDRESS or MUSD_TOKEN unset — skipping");
    return;
  }

  const rpc = process.env.MEZO_RPC_URL ?? "https://rpc.test.mezo.org";
  const key = process.env.KEEPER_PRIVATE_KEY ?? "";
  if (!key) {
    console.warn("[treasury-manager] KEEPER_PRIVATE_KEY unset — skipping");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(key, provider);
  const treasuryManager = new ethers.Contract(TREASURY_MANAGER_ADDRESS, TREASURY_MANAGER_ABI, signer);
  const musdToken = new ethers.Contract(MUSD_TOKEN, ["function balanceOf(address) view returns (uint256)"], provider);

  const treasuryBalance = await musdToken.balanceOf(TREASURY_MANAGER_ADDRESS);
  const min = ethers.parseUnits("1000", 18);

  if (treasuryBalance > min) {
    console.log(`[treasury-manager] Deploying ${ethers.formatUnits(treasuryBalance, 18)} MUSD…`);
    const tx = await treasuryManager.deployTreasury(treasuryBalance);
    const receipt = await tx.wait();
    console.log(`[treasury-manager] Confirmed in block ${receipt?.blockNumber}, tx ${tx.hash}`);
  } else {
    console.log("[treasury-manager] Balance below 1000 MUSD threshold — skipping");
  }
}
