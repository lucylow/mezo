/**
 * OpenZeppelin Defender Autotask
 * Deploy this file as an Autotask on https://defender.openzeppelin.com
 * Set the following secrets in the Autotask configuration:
 *   RPC_URL       – https://rpc.mezo.org (or testnet)
 *   VAULT_ADDRESS – Deployed VeMEZOAutoCompounder address
 */
const { ethers } = require("ethers");

const VAULT_ABI = [
  "function compoundAll() external returns (uint256,uint256,uint256)",
  "function checkUpkeep(uint256) view returns (bool)",
  "function getPendingRewards() view returns (uint256)",
];

exports.handler = async function (event) {
  const { RPC_URL, VAULT_ADDRESS } = event.secrets;
  if (!RPC_URL || !VAULT_ADDRESS) throw new Error("Missing RPC_URL or VAULT_ADDRESS secrets");

  const provider  = new ethers.JsonRpcProvider(RPC_URL);
  const signer    = await provider.getSigner();           // Defender manages the key
  const vault     = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

  const feeData   = await provider.getFeeData();
  const gasPrice  = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");

  const canCompound = await vault.checkUpkeep(gasPrice);
  if (!canCompound) {
    const pending = await vault.getPendingRewards();
    console.log(`Not profitable. Pending rewards: ${ethers.formatEther(pending)} MEZO`);
    return { success: false, reason: "not-profitable", pendingRewards: pending.toString() };
  }

  console.log("Executing compoundAll()…");
  const tx      = await vault.compoundAll();
  const receipt = await tx.wait();

  console.log(`Compounded! Tx: ${receipt.hash}  Block: ${receipt.blockNumber}`);
  return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
};
