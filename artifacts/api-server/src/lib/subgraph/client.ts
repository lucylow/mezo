import { logger } from "../logger";

const SUBGRAPH_URL =
  process.env.GOLDSTY_SUBGRAPH_URL ||
  process.env.GOLDSKY_SUBGRAPH_URL ||
  "";

export async function subgraphRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  if (!SUBGRAPH_URL) {
    throw new Error("GOLDSTY_SUBGRAPH_URL is not configured");
  }

  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph HTTP error: ${response.status} ${response.statusText}`);
  }

  const json: any = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}

export function isSubgraphConfigured(): boolean {
  return Boolean(SUBGRAPH_URL);
}
