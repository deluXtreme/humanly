import { encodeAbiParameters } from "viem";

import type { AbiParameter, Hex } from "./types.ts";

export function abiEncode(parameters: readonly AbiParameter[]): Hex {
  return encodeAbiParameters(
    parameters.map((parameter) => ({ type: parameter.type })),
    parameters.map((parameter) => parameter.value),
  ) as Hex;
}
