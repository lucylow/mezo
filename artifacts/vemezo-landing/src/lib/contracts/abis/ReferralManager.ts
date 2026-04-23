export const ReferralManagerABI = [
  {
    name: "referralCodeOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "referrerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "totalReferralRewards",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "referrer", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "setReferralCode",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "code", type: "string" }],
    outputs: [],
  },
  {
    name: "claimReferralRewards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;
