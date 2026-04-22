import { Router } from "express";
import { subgraphRequest, isSubgraphConfigured } from "../lib/subgraph/client";
import { logger } from "../lib/logger";

const router = Router();

/**
 * POST /api/graphql
 * Transparent proxy to the Goldsky subgraph.
 * Accepts { query, variables } and returns { data } or { errors }.
 */
router.post("/graphql", async (req, res) => {
  const { query, variables } = req.body as { query?: string; variables?: Record<string, any> };

  if (!query) {
    return res.status(400).json({ errors: [{ message: "query is required" }] });
  }

  if (!isSubgraphConfigured()) {
    return res.status(503).json({
      errors: [
        {
          message:
            "Subgraph not configured. Set GOLDSTY_SUBGRAPH_URL to enable GraphQL proxy.",
        },
      ],
    });
  }

  try {
    const data = await subgraphRequest(query, variables);
    return res.json({ data });
  } catch (err: any) {
    logger.error({ err }, "graphql proxy error");
    return res.status(500).json({ errors: [{ message: err.message }] });
  }
});

export default router;
