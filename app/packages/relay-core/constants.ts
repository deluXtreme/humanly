export const MINT_AND_SUBMIT_BID_ABI = [
  {
    type: "function",
    name: "mintAndSubmitBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;
