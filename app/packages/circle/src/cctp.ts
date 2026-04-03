import {
  type Address,
  type Hash,
  type Hex,
  concat,
  encodeFunctionData,
  pad,
  toHex,
} from "viem";
import type { ClientWithPublicActions } from "./types";

const DEPOSIT_FOR_BURN_WITH_HOOK_ABI = [
  {
    type: "function",
    name: "depositForBurnWithHook",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

// Format: [cctp-forward (24 bytes)][version uint32][circle hook len uint32][developer hook data]
export function encodeHookData(developerData: Hex = "0x"): Hex {
  const magic = pad(toHex("cctp-forward"), { size: 24, dir: "right" });
  const version = pad("0x00", { size: 4 });
  const circleHookLen = pad("0x00", { size: 4 });
  return concat([magic, version, circleHookLen, developerData]);
}

export interface DepositForBurnParams {
  tokenMessenger: Address;
  amount: bigint;
  destinationDomain: number;
  mintRecipient: Address;
  burnToken: Address;
  maxFee: bigint;
  minFinalityThreshold?: number;
  hookData: Hex;
}

export async function depositForBurnWithHook(
  client: ClientWithPublicActions,
  params: DepositForBurnParams,
): Promise<Hash> {
  return client.sendTransaction({
    to: params.tokenMessenger,
    data: encodeFunctionData({
      abi: DEPOSIT_FOR_BURN_WITH_HOOK_ABI,
      functionName: "depositForBurnWithHook",
      args: [
        params.amount,
        params.destinationDomain,
        pad(params.mintRecipient, { size: 32 }),
        params.burnToken,
        pad("0x", { size: 32 }),
        params.maxFee,
        params.minFinalityThreshold ?? 1000,
        params.hookData,
      ],
    }),
  });
}
