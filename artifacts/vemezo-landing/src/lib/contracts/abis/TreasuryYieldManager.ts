export const TreasuryYieldManagerABI = [
  {
    name: "getTotalValue",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allocation",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "savingsVault", type: "uint256" },
          { name: "curvePool", type: "uint256" },
          { name: "aerodromePool", type: "uint256" },
          { name: "idle", type: "uint256" },
        ],
      },
    ],
  },
] as const;
