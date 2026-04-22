# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This is the **veMEZO Auto-Compounder** DeFi product, consisting of:
- Landing page at `/` (marketing, never modify)
- DApp at `/app` and sub-routes (React + wagmi + viem)
- API server at `/api` (Express)
- Smart contracts, subgraph indexer, keeper bot (off-chain)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + Wouter (NOT Next.js)
- **Wallet**: wagmi v2 + viem, injected connector only
- **Animations**: Framer Motion
- **UI**: Radix UI primitives, Tailwind CSS

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project Structure

```
contracts/               – Solidity smart contracts
  interfaces/            – IVeMEZO, IGaugeController, IMUSD
  VeMEZOAutoCompounder.sol  – Main vault contract (ERC-4626 style)
  VeMEZOVaultToken.sol   – vveMEZO share token
  hardhat.config.ts      – Mezo Testnet (31611) / Mainnet (31612)
  scripts/deploy.ts      – Deployment script

subgraph/                – Goldsky subgraph indexer
  subgraph.yaml          – Data source config
  schema.graphql         – Vault, User, Deposit, Withdrawal, Compound, DailyMetric
  src/mapping.ts         – AssemblyScript event handlers

keeper/                  – Keeper bot automation
  src/index.ts           – Node.js cron bot (epoch + 6h backup)
  defender-autotask.js   – OpenZeppelin Defender version
  .env.example           – Environment variable template

artifacts/
  api-server/src/
    routes/
      vault.ts           – GET /api/vault/stats|history|compounds|activity
      user.ts            – GET /api/user/position|nfts
      graphql-proxy.ts   – POST /api/graphql (Goldsky proxy)
      keeper.ts          – GET /api/keeper/status
    lib/subgraph/
      client.ts          – subgraphRequest() + isSubgraphConfigured()
      mock.ts            – Realistic mock data (used when subgraph not deployed)

  vemezo-landing/src/
    pages/
      home.tsx           – Landing page (DO NOT MODIFY)
      dashboard.tsx      – DApp dashboard (animated, Framer Motion)
      vault.tsx          – Vault deposit/withdraw
      ... 10 more pages
    components/dapp/
      DAppLayout.tsx     – Sidebar nav + AnimatePresence page transitions
    components/wallet/
      WalletModal.tsx    – Radix Dialog wallet connector
      AccountDisplay.tsx – Radix DropdownMenu when connected
    hooks/wallet/
      useWalletConnection.ts – wagmi hook wrapper
    lib/
      animations.ts      – Framer Motion presets
      utils.ts           – formatNumber, formatDate, shortenAddress, cn
```

## Chain Info

| Network       | Chain ID | RPC                        | Explorer                       |
|---------------|----------|----------------------------|--------------------------------|
| Mezo Testnet  | 31611    | https://rpc.test.mezo.org  | https://explorer.test.mezo.org |
| Mezo Mainnet  | 31612    | https://rpc.mezo.org       | https://explorer.mezo.org      |

## API Endpoints

All routes under `/api`:
- `GET  /healthz`           — Health check
- `GET  /vault/stats`       — Aggregated vault metrics + 7d history
- `GET  /vault/history`     — Daily TVL/rewards (query: `?days=N`)
- `GET  /vault/compounds`   — Recent compound events
- `GET  /vault/activity`    — Protocol-wide activity feed
- `GET  /user/position`     — User shares + deposits/withdrawals (query: `?address=0x...`)
- `GET  /user/nfts`         — User deposited NFT token IDs
- `POST /graphql`           — Goldsky subgraph GraphQL proxy
- `GET  /keeper/status`     — Keeper bot status

All endpoints return `{ data, source }` where `source` is `"mock"` when
`GOLDSTY_SUBGRAPH_URL` is not set, and `"subgraph"` when live.

## Design Tokens

- Primary: Bitcoin-orange `#F5A623`
- Background: `#050608` / `#0a0b0d`
- Card: `bg-black/40 backdrop-blur border-white/8`
- Tagline: "Bloomberg terminal meets luxury watch"

## Important Rules

- Landing page (`src/pages/home.tsx`) must NEVER be modified
- Stack is React + Vite + Wouter (NOT Next.js) — no `use client`, no next/image
- Wallet: `injected()` connector only (no WalletConnect project ID)
- UI: Radix UI (NO headlessui)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
