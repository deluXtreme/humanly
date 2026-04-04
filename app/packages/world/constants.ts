import type { Hex } from "./types.ts";

export const WORLD_DEFAULT_VERIFY_API_BASE_URL =
  "https://developer.world.org/api/v4/verify";

export const WORLD_ORB_VERIFICATION_LEVEL = "orb" as const;
export const WORLD_LEGACY_PROTOCOL_VERSION = "3.0" as const;
export const WORLD_ORB_GROUP_ID = 1n;

export const BASE_WORLD_ID_ROUTER = {
  mainnet: "0xBCC7e5910178AFFEEeBA573ba6903E9869594163",
  sepolia: "0x42FF98C4E85212a5D31358ACbFe76a621b50fC02",
} as const satisfies Record<"mainnet" | "sepolia", Hex>;

export const WORLD_ID_ROUTER_ABI = [
  {
    type: "function",
    name: "verifyProof",
    stateMutability: "view",
    inputs: [
      { name: "root", type: "uint256" },
      { name: "groupId", type: "uint256" },
      { name: "signalHash", type: "uint256" },
      { name: "nullifierHash", type: "uint256" },
      { name: "externalNullifierHash", type: "uint256" },
      { name: "proof", type: "uint256[8]" },
    ],
    outputs: [],
  },
] as const;
