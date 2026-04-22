import { Router } from "express";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import { mockUserPosition } from "../lib/subgraph/mock";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/user/position?address=0x...
 * Returns a user's vault position: shares, underlying value, locked NFT IDs,
 * and their last 10 deposits / withdrawals.
 */
router.get("/user/position", async (req, res) => {
  const address = (req.query.address as string | undefined)?.toLowerCase();
  if (!address) {
    return res.status(400).json({ error: "address query param is required" });
  }
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  try {
    if (!isSubgraphConfigured()) {
      return res.json({ data: mockUserPosition(address), source: "mock" });
    }

    const query = `
      query UserPosition($address: String!) {
        user(id: $address) {
          id
          shareBalance
          underlyingValue
          tokenIds
          createdAt
          updatedAt
          deposits(first: 10, orderBy: timestamp, orderDirection: desc) {
            tokenId
            value
            shares
            transactionHash
            blockNumber
            timestamp
          }
          withdrawals(first: 10, orderBy: timestamp, orderDirection: desc) {
            tokenId
            value
            shares
            transactionHash
            blockNumber
            timestamp
          }
        }
      }
    `;

    const data = await subgraphRequest(query, { address });
    return res.json({ data, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err, address }, "user/position error");
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/nfts?address=0x...
 * Returns the list of veMEZO NFT token IDs deposited by the user.
 */
router.get("/user/nfts", async (req, res) => {
  const address = (req.query.address as string | undefined)?.toLowerCase();
  if (!address) return res.status(400).json({ error: "address query param is required" });

  try {
    if (!isSubgraphConfigured()) {
      const mock = mockUserPosition(address);
      return res.json({
        data: { tokenIds: mock.user?.tokenIds ?? [] },
        source: "mock",
      });
    }

    const query = `
      query UserNFTs($address: String!) {
        user(id: $address) { tokenIds }
      }
    `;

    const data = await subgraphRequest<any>(query, { address });
    return res.json({ data: { tokenIds: data.user?.tokenIds ?? [] }, source: "subgraph" });
  } catch (err: any) {
    logger.error({ err, address }, "user/nfts error");
    return res.status(500).json({ error: err.message });
  }
});

export default router;
