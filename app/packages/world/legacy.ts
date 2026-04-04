import { WORLD_ORB_GROUP_ID } from "./constants.ts";
import type {
  CreateLegacyWorldIdVerificationInput,
  Hex,
  LegacyWorldIdVerificationInput,
} from "./types.ts";

function assertHex(value: string, label: string): asserts value is Hex {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error(`${label} must be a 0x-prefixed hex string`);
  }
}

function hexToBigInt(value: Hex | bigint, label: string): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  assertHex(value, label);
  return BigInt(value);
}

function decodeStaticUint256Array(
  encodedProof: Hex,
  expectedLength: number,
): bigint[] {
  assertHex(encodedProof, "proof");

  const withoutPrefix = encodedProof.slice(2);
  if (withoutPrefix.length === 0 || withoutPrefix.length % 64 !== 0) {
    throw new Error(
      "proof must be an ABI-encoded static uint256 array with 32-byte words",
    );
  }

  const words = withoutPrefix.match(/.{64}/g) ?? [];
  if (words.length !== expectedLength) {
    throw new Error(
      `proof must contain ${expectedLength} uint256 values, received ${words.length}`,
    );
  }

  return words.map((word) => BigInt(`0x${word}`));
}

export function decodeLegacyWorldProof(
  encodedProof: Hex,
): LegacyWorldIdVerificationInput["proof"] {
  const values = decodeStaticUint256Array(encodedProof, 8);
  return [
    values[0]!,
    values[1]!,
    values[2]!,
    values[3]!,
    values[4]!,
    values[5]!,
    values[6]!,
    values[7]!,
  ];
}

export function decodeWorldIdV4Proof(encodedProof: Hex): readonly [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
] {
  const values = decodeStaticUint256Array(encodedProof, 5);
  return [values[0]!, values[1]!, values[2]!, values[3]!, values[4]!];
}

export function createLegacyWorldIdVerificationInput(
  input: CreateLegacyWorldIdVerificationInput,
): LegacyWorldIdVerificationInput {
  return {
    root: hexToBigInt(input.root, "root"),
    groupId: WORLD_ORB_GROUP_ID,
    signalHash: hexToBigInt(input.signalHash, "signalHash"),
    nullifierHash: hexToBigInt(input.nullifierHash, "nullifierHash"),
    externalNullifierHash: hexToBigInt(
      input.externalNullifierHash,
      "externalNullifierHash",
    ),
    proof: decodeLegacyWorldProof(input.proof),
  };
}
