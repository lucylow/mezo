/**
 * Minimal ABI for VeMEZOAutoCompounder + VeMEZOVaultToken (vveMEZO).
 * Only includes the functions and events the frontend actually calls.
 */
export const VeMEZOVaultABI = [
  // ── Read ─────────────────────────────────────────────────────────────────
  {
    name: "totalUnderlying",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "lastCompoundTime",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "performanceFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getPendingRewards",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "totalPending", type: "uint256" }],
  },
  {
    name: "getDepositedTokenCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUserTokenIds",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "nftOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "checkUpkeep",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gasPrice", type: "uint256" }],
    outputs: [{ name: "canCompound", type: "bool" }],
  },
  {
    name: "totalFeesCollectedMusd",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "tigrisRouter",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "autoStakeMUSD",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "musdSavingsVault",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // vaultToken share info
  {
    name: "vaultToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "depositBatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenIds", type: "uint256[]" }],
    outputs: [{ name: "totalShares", type: "uint256" }],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "withdrawByShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
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
  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "user",    type: "address", indexed: true  },
      { name: "tokenId", type: "uint256", indexed: true  },
      { name: "value",   type: "uint256", indexed: false },
      { name: "shares",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "Withdrawn",
    type: "event",
    inputs: [
      { name: "user",    type: "address", indexed: true  },
      { name: "tokenId", type: "uint256", indexed: true  },
      { name: "value",   type: "uint256", indexed: false },
      { name: "shares",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "Compounded",
    type: "event",
    inputs: [
      { name: "totalRewards",    type: "uint256", indexed: false },
      { name: "fee",             type: "uint256", indexed: false },
      { name: "amountCompounded",type: "uint256", indexed: false },
    ],
  },
  {
    name: "FeeCollected",
    type: "event",
    inputs: [
      { name: "mezoAmount", type: "uint256", indexed: false },
      { name: "musdAmount", type: "uint256", indexed: false },
      { name: "treasury",   type: "address", indexed: false },
    ],
  },
  {
    name: "TreasuryStaked",
    type: "event",
    inputs: [
      { name: "musdAmount",     type: "uint256", indexed: false },
      { name: "sharesReceived", type: "uint256", indexed: false },
    ],
  },
  // ── Fee distribution (Phase 3) ────────────────────────────────────────────
  {
    name: "feeDistributionRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "feePool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "pendingFeeRewards",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claimFeeRewards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "setFeeDistributionRate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "newRate", type: "uint256" }],
    outputs: [],
  },
  {
    name: "FeeDistributed",
    type: "event",
    inputs: [
      { name: "totalFee",    type: "uint256", indexed: false },
      { name: "toHolders",   type: "uint256", indexed: false },
      { name: "toTreasury",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "RewardsClaimed",
    type: "event",
    inputs: [
      { name: "user",   type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
