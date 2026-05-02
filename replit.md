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
    hooks/contracts/
      useVaultRead.ts    – wagmi useReadContracts (on-chain vault + user data, zero-addr guard)
      useVaultWrite.ts   – useDeposit, useWithdraw, useWithdrawByShares, useCompound (wagmi)
      useVeMEZOData.ts   – useVeMEZONFTs, useVeMEZOApproval (wallet-owned NFT enumeration)
    hooks/api/
      useVaultAPI.ts     – TanStack Query hooks: useVaultAPIStats, useVaultAPIHistory,
                           useUserAPIPosition, useVaultActivityFeed, useKeeperStatus
    hooks/
      useVaultStats.ts   – Unified hook: on-chain → API → mock fallback
      useUserPosition.ts – Unified hook: on-chain → API → mock fallback
      useTransactionToast.ts – Sonner toasts wired to useWaitForTransactionReceipt
      useContractEvents.ts   – useWatchContractEvent for Deposited/Withdrawn/Compounded
      useKeeper.ts           – useTriggerCompound (POST /api/keeper/compound)
    store/
      transactionStore.ts – Zustand transaction history with persist middleware
    lib/
      contracts/
        index.ts         – CONTRACTS addresses (VITE_* env vars), isContractDeployed()
        abis/VeMEZOVault.ts – Full vault ABI (reads, writes, events)
        abis/VeMEZO.ts   – veMEZO NFT ABI
      api/client.ts      – Typed fetch client for Express API
      retry.ts           – withRetry() exponential backoff utility
      animations.ts      – Framer Motion presets
      utils.ts           – formatNumber, formatDate, shortenAddress, cn
    components/
      ContractErrorBoundary.tsx – React error boundary for contract interaction sections
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
  - `@mezo-org/passport` is installed but NOT imported in browser code (web3/Buffer/process Node deps break Vite).
  - The passport package is available in keeper/ and server-side Node contexts.
  - WalletModal shows Mezo Passport branding with Bitcoin wallet guidance.
- UI: Radix UI (NO headlessui)

## Security Hardening (May 2026 — Session 3)

### VeMEZOAutoCompounder.sol — 7 New Security Features

All features compile cleanly (0 Hardhat errors, 74 typings generated).

1. **Multi-keeper registry** (`mapping(address => bool) public authorizedKeepers`)
   - Replaces single `keeper` address with a full authorised-keeper registry.
   - `addKeeper(addr)` / `removeKeeper(addr)` allow independent keepers (Gelato, Chainlink, EOA) to operate simultaneously.
   - `updateKeeper(new)` atomically rotates the primary keeper: removes old, adds new, emits `KeeperUpdated` + `KeeperAdded` + `KeeperRemoved`.
   - `onlyKeeper` and `onlyKeeperOrOwner` modifiers check `authorizedKeepers[msg.sender]`.
   - Deployer auto-registered in constructor.

2. **Deposit lock period** (`minDepositDuration = 7 days`, configurable 0–30 days)
   - `depositedAt[tokenId]` records deposit timestamp per NFT.
   - `withdraw(tokenId)` reverts `DepositLocked(tokenId, lockedUntil, current)` if lock hasn't elapsed.
   - `_findWithdrawableNFT` skips locked NFTs; `withdrawByShares` reverts `NoUnlockedNFT` if all are locked.
   - `emergencyWithdraw` bypasses the lock (owner-only recovery path).
   - `depositUnlockTime(tokenId)` view for frontends.
   - `setMinDepositDuration(newDuration)` — bounded to `MAX_DEPOSIT_DURATION = 30 days`.

3. **Compound cooldown** (`minCompoundInterval = 1 hour`, configurable 0–7 days)
   - `compoundAll()` reverts `CompoundTooSoon(nextAllowed, current)` if called before cooldown elapses.
   - `checkUpkeep()` also respects the cooldown for off-chain callers.
   - `setMinCompoundInterval(interval)` — bounded to `MAX_COMPOUND_INTERVAL = 7 days`.

4. **Paginated compounding** (`compoundBatch(startIndex, batchSize)`)
   - Allows large vaults to be processed in keeper-sized chunks.
   - Does not enforce the `minCompoundInterval` (meant for multi-call slicing); updates `lastCompoundTime` on each call so the next `compoundAll()` is still gated.

5. **Configurable swap slippage** (`swapSlippageBps = 100`, bounded 10–500 bps)
   - `_minMusdOut` uses `swapSlippageBps` instead of the hardcoded `(expected * 99) / 100`.
   - `setSwapSlippage(bps)` — reverts `InvalidSlippage` if out of [10, 500] range.
   - Constants: `MIN_SLIPPAGE_BPS = 10`, `MAX_SLIPPAGE_BPS = 500`.

6. **`nonReentrant` on `emergencyWithdraw`**
   - Added missing reentrancy guard on the owner-callable emergency function that performs an external NFT transfer.

7. **`setAutoStakeMUSD` address validation**
   - Reverts `InvalidAddress()` if `enabled=true` and `savingsVault=address(0)`, preventing a misconfiguration where fees silently have no target.

### Keeper Bot Updates
- `VAULT_ABI` in `index.ts`: added `compoundBatch`, `lastCompoundTime`, `minCompoundInterval`, `checkUpkeep`, `depositUnlockTime`, `keeper`, `authorizedKeepers`, `addKeeper`, `removeKeeper`, `KeeperAdded`, `KeeperRemoved`.
- `watcher.ts`: now watches `KeeperAdded` (HIGH), `KeeperRemoved` (HIGH), `MinDepositDurationUpdated` (MEDIUM), `MinCompoundIntervalUpdated` (MEDIUM), `SwapSlippageUpdated` (MEDIUM), `PerformanceFeeUpdated` (MEDIUM).

### Frontend ABI Updates (`abis/VeMEZOVault.ts`)
- Added reads: `minDepositDuration`, `depositedAt`, `depositUnlockTime`, `minCompoundInterval`, `swapSlippageBps`, `keeper`, `authorizedKeepers`.
- Added events: `KeeperAdded`, `KeeperRemoved`, `KeeperUpdated`, `MinDepositDurationUpdated`, `MinCompoundIntervalUpdated`, `SwapSlippageUpdated`.

## Architecture Improvements (May 2026)

### Subgraph
- Removed dead `FeeRewardClaimed` import and `handleFeeRewardClaimed` handler from `mapping.ts` — the contract never emits this event (it emits `RewardsClaimed`). Dead handler would break Goldsky subgraph build.
- Removed duplicate `FeeRewardClaimed` entry from `subgraph.yaml` eventHandlers.
- Added `EpochVote` to the entities list in `subgraph.yaml` (was missing despite being used in mapping).

### Smart Contracts
- **GelatoCompounder** and **ChainlinkCompounder**: Replaced all `require` strings with custom errors. Added on-chain interval guard to `executeCompound`/`performUpkeep` (previously checker was off-chain only).
- **TreasuryYieldManager**: Fixed critical `harvestAll()` bug — `beforeBalance` and `afterBalance` were assigned identically, so yield was always 0. Now uses `_lastHarvestValue` snapshot pattern. Added `InvalidAddress`, `InsufficientBalance`, and `AllocationMustSum10000` custom errors. Resets approval to 0 after each `forceApprove` on the savings vault.
- **VaultMultiSig**: Replaced all `require` strings with custom errors. Added `unchecked { ++i }` for loop counters. Added `ActionWindowUpdated` event.

### Deploy Scripts
- **deploy.ts**: Fixed missing `hre` import (was using `hre as any` which would fail at runtime). Now imports `hre` from hardhat and also verifies the VaultToken.
- **deploy-full.ts**: Added `TreasuryYieldManager` deployment step (step 4). Added inline `hre` import. Added per-contract verification loop. Added Timelock ownership-acceptance note in summary.

### Keeper Bot
- Added `keeper/src/watcher.ts`: WebSocket event watcher using `wss://rpc-ws.test.mezo.org`. Subscribes to all vault events (Deposited, Withdrawn, Compounded, GaugesVoted, RewardsClaimed, KeeperUpdated, Paused) in real time. Auto-reconnects with exponential back-off up to 10 attempts.
- `index.ts`: `startWatcher(logger)` is called on boot alongside the cron. Errors are non-fatal (logged as warn, keeper continues).
- `keeper/.env.example`: Added `MEZO_WSS_URL` variable.

## Recent Feature Additions (April 2026)

### Smart Contracts
- `VeMEZOAutoCompounder.sol`: Added `voteForGauges()` function — recasts gauge votes for all deposited NFTs (keeper-callable, epoch-aligned). Also added `setGaugeVotes()`, `getGaugeVotes()`, `GaugeVote` struct, `lastVoteTime` state, and `GaugesVoted`/`GaugeVotesSet` events.

### Keeper Bot (`keeper/src/index.ts`)
- Added `recastVotes()` function — calls `voteForGauges()` on vault after compound.
- Epoch cron: compound at Thursday 00:05 UTC, vote recast at Thursday 00:07 UTC.
- Vault ABI updated with `voteForGauges`, `lastVoteTime`, `getGaugeVotes`, `GaugesVoted` event.

### Frontend New Components
- `BoostCalculator.tsx`: Interactive slider showing veMEZO lock duration → boost multiplier → effective APR (max 2.5× at 4-year lock).
- `EpochTimer.tsx`: Live countdown to next epoch (Thursday 00:05 UTC) with progress bar.

### Subgraph Updates
- `schema.graphql`: Added `EpochVote` entity.
- `subgraph.yaml`: Added `GaugesVoted` event handler.
- `mapping.ts`: Added `handleGaugesVoted` function.

### Type Fixes
- `useVaultAPI.ts`: Added `treasuryMUSDValue` and `treasuryAPY` to select transform.
- `client.ts` (`VaultStatsData`): Added optional `treasuryMUSDValue` and `treasuryAPY` fields.
- `DepositForm.tsx`: Fixed `unlockDate` → uses `n.lockEnd.toISOString()`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
