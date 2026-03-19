// Contract addresses from deployments/paseo.json
export const CONTRACTS = {
  paseo: {
    chainId: 420420417,
    NeuroVault: "0x1e7508e4Dcd408B15Ecffab8b8dAc02C71bc51A8",
    PAS: "0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a",
    USDC: "0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3",
    agentAddress: "0xc5b7b574EE84A9B59B475FE32Eaf908C246d3859",
    hyperbridgeDispatch: "0xbb26e04a71e7c12093e82b83ba310163eac186fa",
  },
} as const;

// NeuroVault Contract ABI (simplified for frontend use)
export const NEUROVAULT_ABI = [
  // View functions
  {
    inputs: [],
    name: "getTreasuryState",
    outputs: [
      { internalType: "uint256", name: "totalValue", type: "uint256" },
      { internalType: "uint256", name: "dotBalance", type: "uint256" },
      { internalType: "uint256", name: "usdcBalance", type: "uint256" },
      { internalType: "uint256", name: "activeProposals", type: "uint256" },
      { internalType: "uint256", name: "apy", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveGoals",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "text", type: "string" },
          { internalType: "uint8", name: "status", type: "uint8" },
        ],
        internalType: "struct NeuroVault.GoalView[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    name: "getRecentProposals",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "string", name: "outcome", type: "string" },
        ],
        internalType: "struct NeuroVault.ProposalView[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposal",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "uint8", name: "actionType", type: "uint8" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "address", name: "targetToken", type: "address" },
          { internalType: "uint256", name: "confidence", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint256", name: "votesFor", type: "uint256" },
          { internalType: "uint256", name: "votesAgainst", type: "uint256" },
          { internalType: "uint256", name: "snapshotTotalStaked", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "votingDeadline", type: "uint256" },
          { internalType: "string", name: "outcome", type: "string" },
          { internalType: "address", name: "proposer", type: "address" },
        ],
        internalType: "struct NeuroVault.Proposal",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "staker", type: "address" }],
    name: "getStakerInfo",
    outputs: [
      { internalType: "uint256", name: "staked", type: "uint256" },
      { internalType: "uint256", name: "votingPower", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakerCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentApy",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "depositUsdc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "bool", name: "support", type: "bool" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "finalizeProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "string", name: "ipfsHash", type: "string" },
      { indexed: false, internalType: "uint8", name: "actionType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "confidence", type: "uint256" },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "support", type: "bool" },
      { indexed: false, internalType: "uint256", name: "weight", type: "uint256" },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "staker", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "staker", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Unstaked",
    type: "event",
  },
] as const;

// ERC20 Token ABI (minimal)
export const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  paseo: {
    id: 420420417,
    name: "Paseo Testnet",
    nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
    rpcUrls: {
      default: { http: ["https://paseo-hub-rpc.polkadot.io"] },
    },
    blockExplorers: {
      default: { name: "Explorer", url: "https://paseo.subscan.io" },
    },
  },
} as const;
