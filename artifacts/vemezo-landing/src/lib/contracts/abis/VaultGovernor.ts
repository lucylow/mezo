export const VaultGovernorABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_token",             "type": "address" },
      { "name": "_timelock",          "type": "address" },
      { "name": "_votingDelay",       "type": "uint256" },
      { "name": "_votingPeriod",      "type": "uint256" },
      { "name": "_proposalThreshold", "type": "uint256" },
      { "name": "_quorumAmount",      "type": "uint256" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "version",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingDelay",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingPeriod",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalThreshold",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quorumAmount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quorum",
    "inputs": [{ "name": "blockNumber", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "state",
    "inputs": [{ "name": "proposalId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalDeadline",
    "inputs": [{ "name": "proposalId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalSnapshot",
    "inputs": [{ "name": "proposalId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalVotes",
    "inputs": [{ "name": "proposalId", "type": "uint256" }],
    "outputs": [
      { "name": "againstVotes", "type": "uint256" },
      { "name": "forVotes",     "type": "uint256" },
      { "name": "abstainVotes", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasVoted",
    "inputs": [
      { "name": "proposalId", "type": "uint256" },
      { "name": "account",    "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVotes",
    "inputs": [
      { "name": "account",     "type": "address" },
      { "name": "timepoint",   "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "propose",
    "inputs": [
      { "name": "targets",     "type": "address[]" },
      { "name": "values",      "type": "uint256[]" },
      { "name": "calldatas",   "type": "bytes[]" },
      { "name": "description", "type": "string" }
    ],
    "outputs": [{ "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVote",
    "inputs": [
      { "name": "proposalId", "type": "uint256" },
      { "name": "support",    "type": "uint8" }
    ],
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteWithReason",
    "inputs": [
      { "name": "proposalId", "type": "uint256" },
      { "name": "support",    "type": "uint8" },
      { "name": "reason",     "type": "string" }
    ],
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "queue",
    "inputs": [
      { "name": "targets",         "type": "address[]" },
      { "name": "values",          "type": "uint256[]" },
      { "name": "calldatas",       "type": "bytes[]" },
      { "name": "descriptionHash", "type": "bytes32" }
    ],
    "outputs": [{ "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      { "name": "targets",         "type": "address[]" },
      { "name": "values",          "type": "uint256[]" },
      { "name": "calldatas",       "type": "bytes[]" },
      { "name": "descriptionHash", "type": "bytes32" }
    ],
    "outputs": [{ "name": "proposalId", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "cancel",
    "inputs": [
      { "name": "targets",         "type": "address[]" },
      { "name": "values",          "type": "uint256[]" },
      { "name": "calldatas",       "type": "bytes[]" },
      { "name": "descriptionHash", "type": "bytes32" }
    ],
    "outputs": [{ "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ProposalCreated",
    "inputs": [
      { "name": "proposalId",  "type": "uint256", "indexed": false },
      { "name": "proposer",    "type": "address", "indexed": false },
      { "name": "targets",     "type": "address[]","indexed": false },
      { "name": "values",      "type": "uint256[]","indexed": false },
      { "name": "signatures",  "type": "string[]", "indexed": false },
      { "name": "calldatas",   "type": "bytes[]",  "indexed": false },
      { "name": "voteStart",   "type": "uint256",  "indexed": false },
      { "name": "voteEnd",     "type": "uint256",  "indexed": false },
      { "name": "description", "type": "string",   "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "VoteCast",
    "inputs": [
      { "name": "voter",      "type": "address", "indexed": true },
      { "name": "proposalId", "type": "uint256", "indexed": false },
      { "name": "support",    "type": "uint8",   "indexed": false },
      { "name": "weight",     "type": "uint256", "indexed": false },
      { "name": "reason",     "type": "string",  "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ProposalExecuted",
    "inputs": [{ "name": "proposalId", "type": "uint256", "indexed": false }]
  },
  {
    "type": "event",
    "name": "ProposalQueued",
    "inputs": [
      { "name": "proposalId", "type": "uint256", "indexed": false },
      { "name": "etaSeconds", "type": "uint256", "indexed": false }
    ]
  }
] as const;
