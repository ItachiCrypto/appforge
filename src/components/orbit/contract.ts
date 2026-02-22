export const REGISTRY_ADDRESS = "0xC087A87e583534E9FaCe737935D0267a46207AFc";

export const BASE_CHAIN = {
  chainId: "0x2105",
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

export const REGISTRY_ABI = [
  {
    inputs: [{ type: "bytes", name: "question" }, { type: "uint256", name: "maxLen" }],
    name: "chat",
    outputs: [{ type: "bytes", name: "response" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "bytes", name: "prompt" }, { type: "uint256", name: "maxLen" }],
    name: "generate",
    outputs: [{ type: "bytes", name: "result" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "bytes", name: "text" }, { type: "uint256", name: "maxSteps" }],
    name: "trainOnText",
    outputs: [{ type: "uint256", name: "steps" }, { type: "uint256", name: "totalUpdates" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { type: "uint256", name: "nShards" },
      { type: "uint256", name: "predictions" },
      { type: "uint256", name: "trainSteps" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getShardCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "address", name: "user" }],
    name: "getRewards",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
