import { keccak256, stringToHex } from "viem";

import type {
  CreateWorldUniquenessVerificationInput,
  Hex,
  WorldIdKitResult,
  WorldRpId,
  WorldUniquenessResultV4,
  WorldUniquenessVerificationInput,
  WorldV4ProofResponse,
} from "./types.ts";

function assertHex(value: string, label: string): asserts value is Hex {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`${label} must be a 0x-prefixed hex string.`);
  }
}

function hexToBigInt(value: Hex, label: string): bigint {
  assertHex(value, label);
  return BigInt(value);
}

function assertUint64(value: bigint, label: string): bigint {
  if (value < 0n || value > (2n ** 64n) - 1n) {
    throw new Error(`${label} must fit uint64.`);
  }

  return value;
}

export function isWorldV4ProofResponse(value: unknown): value is WorldV4ProofResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorldV4ProofResponse>;

  return (
    typeof candidate.identifier === "string" &&
    typeof candidate.nullifier === "string" &&
    Array.isArray(candidate.proof) &&
    candidate.proof.length === 5 &&
    candidate.proof.every((item) => typeof item === "string") &&
    typeof candidate.issuer_schema_id === "number" &&
    typeof candidate.expires_at_min === "number"
  );
}

export function isWorldUniquenessResultV4(
  value: unknown,
): value is WorldUniquenessResultV4 {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorldUniquenessResultV4>;

  return (
    candidate.protocol_version === "4.0" &&
    typeof candidate.nonce === "string" &&
    typeof candidate.action === "string" &&
    Array.isArray(candidate.responses) &&
    candidate.responses.every((response) => isWorldV4ProofResponse(response))
  );
}

export function hashWorldAction(action: string): Hex {
  return keccak256(stringToHex(action));
}

export function parseWorldRpIdToUint64(rpId: WorldRpId | string): bigint {
  if (!rpId.startsWith("rp_")) {
    throw new Error("rpId must start with `rp_`.");
  }

  const suffix = rpId.slice(3);
  if (!/^[0-9a-fA-F]+$/.test(suffix)) {
    throw new Error("rpId suffix must be hex-encoded.");
  }

  return assertUint64(BigInt(`0x${suffix}`), "rpId");
}

export function createWorldUniquenessVerificationInput(
  input: CreateWorldUniquenessVerificationInput,
): WorldUniquenessVerificationInput {
  const response = input.result.responses[input.responseIndex ?? 0];

  if (!response) {
    throw new Error("World uniqueness proof result does not contain a response.");
  }

  const signalHash = response.signal_hash;

  if (!signalHash) {
    throw new Error("World uniqueness proof result does not include `signal_hash`.");
  }

  return {
    nullifier: hexToBigInt(response.nullifier, "nullifier"),
    action: BigInt(hashWorldAction(input.result.action)),
    rpId: parseWorldRpIdToUint64(input.rpId),
    nonce: hexToBigInt(input.result.nonce, "nonce"),
    signalHash: hexToBigInt(signalHash, "signal_hash"),
    expiresAtMin: assertUint64(BigInt(response.expires_at_min), "expires_at_min"),
    issuerSchemaId: assertUint64(
      BigInt(response.issuer_schema_id),
      "issuer_schema_id",
    ),
    credentialGenesisIssuedAtMin: BigInt(
      response.credential_genesis_issued_at_min ?? 0,
    ),
    zeroKnowledgeProof: [
      hexToBigInt(response.proof[0]!, "proof[0]"),
      hexToBigInt(response.proof[1]!, "proof[1]"),
      hexToBigInt(response.proof[2]!, "proof[2]"),
      hexToBigInt(response.proof[3]!, "proof[3]"),
      hexToBigInt(response.proof[4]!, "proof[4]"),
    ],
  };
}

export function assertWorldUniquenessResultV4(
  value: WorldIdKitResult | unknown,
): asserts value is WorldUniquenessResultV4 {
  if (!isWorldUniquenessResultV4(value)) {
    throw new Error(
      "Expected a World ID 4.0 uniqueness result. Do not use legacy presets for the Humanly create-auction flow.",
    );
  }
}
