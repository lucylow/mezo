import { Router } from "express";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mezoTestnet, mezo } from "viem/chains";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import { mockKeeperStatus } from "../lib/subgraph/mock";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/keeper/status
 * Returns the keeper bot's last run time, next expected run, pending rewards,
 * and whether compounding is currently profitable.
 */
router.get("/keeper/status", async (req, res) => {
  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: mockKeeperStatus(), source: "mock" });
    }

    const query = `
      query KeeperStatus {
        vault(id: "vemezo-auto-compounder") {
          lastCompoundTime
          totalDeposits
        }
        compounds(first: 1, orderBy: timestamp, orderDirection: desc) {
          transactionHash
          blockNumber
          timestamp
          totalRewards
        }
      }
    `;

    const raw = await subgraphRequest<any>(query);
    const lastCompound = raw.compounds?.[0];
    const DAY = 86400;
    const now = Math.floor(Date.now() / 1000);

    return res.json({
      data: {
        lastRun: lastCompound?.timestamp ?? "0",
        nextRun: lastCompound ? String(Number(lastCompound.timestamp) + 7 * DAY) : "0",
        pendingRewards: "0",
        depositedTokenCount: raw.vault?.totalDeposits ?? 0,
        canCompound: false,
        lastTxHash: lastCompound?.transactionHash ?? null,
        lastBlockNumber: lastCompound ? Number(lastCompound.blockNumber) : 0,
        network: process.env.MEZO_CHAIN_ID === "31612" ? "mezo-mainnet" : "mezo-testnet",
        chainId: Number(process.env.MEZO_CHAIN_ID ?? 31611),
      },
      source: "subgraph",
    });
  } catch (err: any) {
    logger.error({ err }, "keeper/status error");
    return res.status(500).json({ error: err.message });
  }
});

// Minimal ABI for the compound call
const VAULT_ABI = [
  {
    name: "checkUpkeep",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gasPrice", type: "uint256" }],
    outputs: [{ name: "canCompound", type: "bool" }],
  },
  {
    name: "compoundAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [
      { name: "totalRewards",    type: "uint256" },
      { name: "totalFee",        type: "uint256" },
      { name: "totalCompounded", type: "uint256" },
    ],
  },
] as const;

/**
 * POST /api/keeper/compound
 * Triggers an on-chain compoundAll() call from the keeper wallet.
 * Requires:
 *   Authorization: Bearer <KEEPER_API_SECRET>
 *   KEEPER_PRIVATE_KEY and VAULT_ADDRESS env vars
 */
router.post("/keeper/compound", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const secret     = process.env.KEEPER_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const vaultAddress = process.env.VAULT_ADDRESS as `0x${string}` | undefined;
  const privateKey   = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined;

  if (!vaultAddress || !privateKey) {
    logger.warn("keeper/compound called but VAULT_ADDRESS or KEEPER_PRIVATE_KEY not set");
    return res.status(503).json({
      success: false,
      reason: "not-configured",
      message: "VAULT_ADDRESS and KEEPER_PRIVATE_KEY must be set",
    });
  }

  try {
    const useMainnet   = process.env.MEZO_CHAIN_ID === "31612";
    const chain        = useMainnet ? mezo : mezoTestnet;
    const rpcUrl       = process.env.MEZO_RPC_URL ??
      (useMainnet ? "https://rpc-http.mezo.boar.network" : "https://rpc.test.mezo.org");

    const account      = privateKeyToAccount(privateKey);
    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

    // Profitability check
    const gasPrice   = await publicClient.getGasPrice();
    const canCompound = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "checkUpkeep",
      args: [gasPrice],
    });

    if (!canCompound) {
      logger.info({ gasPrice: gasPrice.toString() }, "keeper/compound: not profitable");
      return res.json({ success: false, reason: "not-profitable" });
    }

    const hash = await walletClient.writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "compoundAll",
    });

    logger.info({ hash }, "keeper/compound: tx submitted");
    return res.json({ success: true, txHash: hash });
  } catch (err: any) {
    logger.error({ err }, "keeper/compound error");
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
