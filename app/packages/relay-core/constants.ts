export const TOKEN_MESSENGER_V2 =
  "0x28b5a0e9c621a5badaa536219b3a228c8168cf5d" as const;

export const DEPOSIT_FOR_BURN_TOPIC =
  "0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5" as const;

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
