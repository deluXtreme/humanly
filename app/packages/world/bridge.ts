import { keccak256 } from "viem";

import type {
  CreateWorldBridgeRequestInput,
  CreateWorldBridgeV4PayloadInput,
  Hex,
  WorldBridgeCompletion,
  WorldBridgeCreateRequestPayload,
  WorldBridgeCreateResponse,
  WorldBridgeEncryptedPayload,
  WorldBridgePollResponse,
  WorldBridgePollStatus,
  WorldFetchImplementation,
  WorldIdKitResult,
} from "./types.ts";

const WORLD_DEFAULT_BRIDGE_BASE_URL = "https://bridge.worldcoin.org";
const WORLD_DEFAULT_CONNECT_BASE_URL = "https://world.org";
const WORLD_BRIDGE_DEFAULT_POLL_INTERVAL_MS = 1_000;
const WORLD_BRIDGE_DEFAULT_TIMEOUT_MS = 15 * 60 * 1_000;
const WORLD_V4_PROOF_REQUEST_VERSION = 1 as const;
const WORLD_PROOF_OF_HUMAN_ISSUER_SCHEMA_ID = 1;

function assertHex(value: string): asserts value is Hex {
  if (!/^0x[0-9a-fA-F]+$/.test(value) || value.length % 2 !== 0) {
    throw new Error("Expected a 0x-prefixed even-length hex string.");
  }
}

function getCryptoImplementation(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is required for the World bridge transport.");
  }

  return globalThis.crypto;
}

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
}

function hexToBytes(value: Hex): Uint8Array {
  assertHex(value);
  return Uint8Array.from(
    value
      .slice(2)
      .match(/.{1,2}/g)
      ?.map((chunk) => Number.parseInt(chunk, 16)) ?? [],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function hashToField(value: Uint8Array): Hex {
  const hash = BigInt(keccak256(value)) >> 8n;
  return `0x${hash.toString(16).padStart(64, "0")}` as const;
}

export function hashWorldSignal(signal: string | Uint8Array): Hex {
  if (signal instanceof Uint8Array) {
    return hashToField(signal);
  }

  if (signal.startsWith("0x") && signal.length > 2 && signal.length % 2 === 0) {
    try {
      return hashToField(hexToBytes(signal as Hex));
    } catch {
      // Fall through to plain-text hashing.
    }
  }

  return hashToField(encodeUtf8(signal));
}

function buildWorldOprfKeyId(rpId: string): Hex {
  if (!rpId.startsWith("rp_")) {
    throw new Error("rp_id must start with `rp_`.");
  }

  const suffix = rpId.slice(3);
  if (!/^[0-9a-fA-F]+$/.test(suffix)) {
    throw new Error("rp_id suffix must be hex-encoded.");
  }

  return `0x${suffix}` as const;
}

export function createWorldBridgeV4Payload(
  input: CreateWorldBridgeV4PayloadInput,
): WorldBridgeCreateRequestPayload {
  const proofRequestId =
    input.proofRequestId ??
    getCryptoImplementation().randomUUID?.() ??
    crypto.randomUUID();

  const payload: WorldBridgeCreateRequestPayload = {
    action: input.action,
    allow_legacy_proofs: false,
    app_id: input.appId,
    environment: input.environment,
    proof_request: {
      action: hashWorldSignal(input.action),
      created_at: Number(input.rpContext.created_at),
      expires_at: Number(input.rpContext.expires_at),
      id: proofRequestId,
      nonce: input.rpContext.nonce,
      oprf_key_id: buildWorldOprfKeyId(input.rpContext.rp_id),
      proof_requests: [
        {
          identifier: "proof_of_human",
          issuer_schema_id: WORLD_PROOF_OF_HUMAN_ISSUER_SCHEMA_ID,
          genesis_issued_at_min: input.genesisIssuedAtMin ?? null,
          expires_at_min: null,
        },
      ],
      rp_id: input.rpContext.rp_id,
      session_id: null,
      signature: input.rpContext.signature,
      version: WORLD_V4_PROOF_REQUEST_VERSION,
    },
  };

  if (typeof input.signal === "string" && input.signal.length > 0) {
    payload.signal = hashWorldSignal(input.signal);
  }

  return payload;
}

async function generateBridgeEncryption(): Promise<{
  keyBase64: string;
  keyBytes: Uint8Array;
  payload: WorldBridgeEncryptedPayload;
}> {
  const cryptoImplementation = getCryptoImplementation();
  const keyBytes = cryptoImplementation.getRandomValues(new Uint8Array(32));
  const ivBytes = cryptoImplementation.getRandomValues(new Uint8Array(12));

  return {
    keyBase64: bytesToBase64(keyBytes),
    keyBytes,
    payload: {
      iv: bytesToBase64(ivBytes),
      payload: "",
    },
  };
}

async function encryptBridgePayload(
  plaintext: string,
): Promise<{
  keyBase64: string;
  keyBytes: Uint8Array;
  encryptedPayload: WorldBridgeEncryptedPayload;
}> {
  const cryptoImplementation = getCryptoImplementation();
  const { keyBase64, keyBytes, payload } = await generateBridgeEncryption();
  const key = await cryptoImplementation.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const ivBytes = base64ToBytes(payload.iv);
  const ciphertext = await cryptoImplementation.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(ivBytes),
    },
    key,
    toArrayBuffer(encodeUtf8(plaintext)),
  );

  return {
    keyBase64,
    keyBytes,
    encryptedPayload: {
      iv: payload.iv,
      payload: bytesToBase64(new Uint8Array(ciphertext)),
    },
  };
}

async function decryptBridgePayload(
  encryptedPayload: WorldBridgeEncryptedPayload,
  keyBytes: Uint8Array,
): Promise<unknown> {
  const cryptoImplementation = getCryptoImplementation();
  const key = await cryptoImplementation.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const plaintext = await cryptoImplementation.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64ToBytes(encryptedPayload.iv)),
    },
    key,
    toArrayBuffer(base64ToBytes(encryptedPayload.payload)),
  );

  return JSON.parse(decodeUtf8(new Uint8Array(plaintext)));
}

function normalizeBridgeResult(
  decryptedPayload: unknown,
  context: {
    action: string;
    environment: string;
    nonce: Hex;
    signalHash?: Hex;
  },
): unknown {
  if (!decryptedPayload || typeof decryptedPayload !== "object") {
    return decryptedPayload;
  }

  const candidate = decryptedPayload as Record<string, unknown>;

  if (candidate.protocol_version === "4.0" || candidate.protocol_version === "3.0") {
    return decryptedPayload;
  }

  if (
    candidate.status === "error" ||
    typeof candidate.error_code === "string" ||
    typeof candidate.error === "string"
  ) {
    return {
      status: "error",
      error_code:
        (typeof candidate.error_code === "string" && candidate.error_code) ||
        (typeof candidate.error === "string" && candidate.error) ||
        "generic_error",
    };
  }

  if ("proof_response" in candidate && candidate.proof_response) {
    const proofResponse = candidate.proof_response as Record<string, unknown>;
    const responses = Array.isArray(proofResponse.responses)
      ? proofResponse.responses
      : [];

    return {
      protocol_version: "4.0",
      nonce:
        ((typeof proofResponse.nonce === "string" && proofResponse.nonce) ||
          context.nonce) as Hex,
      action:
        (typeof proofResponse.action === "string" && proofResponse.action) ||
        context.action,
      responses: responses.map((response) => {
        const item = response as Record<string, unknown>;
        return {
          identifier:
            typeof item.identifier === "string" ? item.identifier : "orb",
          signal_hash:
            typeof item.signal_hash === "string"
              ? (item.signal_hash as Hex)
              : context.signalHash,
          proof: item.proof as readonly [Hex, Hex, Hex, Hex, Hex] | Hex[],
          nullifier: item.nullifier as Hex,
          issuer_schema_id: Number(item.issuer_schema_id),
          expires_at_min: Number(item.expires_at_min),
          credential_genesis_issued_at_min:
            typeof item.credential_genesis_issued_at_min === "number"
              ? item.credential_genesis_issued_at_min
              : undefined,
        };
      }),
      environment: context.environment,
    } as WorldIdKitResult;
  }

  if ("verifications" in candidate && Array.isArray(candidate.verifications)) {
    return {
      protocol_version: "3.0",
      nonce: context.nonce,
      action: context.action,
      responses: candidate.verifications.map((verification) => {
        const item = verification as Record<string, unknown>;
        return {
          identifier: item.verification_level,
          signal_hash:
            (typeof item.signal_hash === "string" && item.signal_hash) ||
            context.signalHash,
          proof: item.proof,
          merkle_root: item.merkle_root,
          nullifier: item.nullifier_hash,
        };
      }),
      environment: context.environment,
    };
  }

  if (
    "verification_level" in candidate &&
    "proof" in candidate &&
    "merkle_root" in candidate
  ) {
    return {
      protocol_version: "3.0",
      nonce: context.nonce,
      action: context.action,
      responses: [
        {
          identifier: candidate.verification_level,
          signal_hash:
            (typeof candidate.signal_hash === "string" && candidate.signal_hash) ||
            context.signalHash,
          proof: candidate.proof,
          merkle_root: candidate.merkle_root,
          nullifier: candidate.nullifier_hash,
        },
      ],
      environment: context.environment,
    };
  }

  return decryptedPayload;
}

function normalizeBridgeError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const candidate = payload as Record<string, unknown>;
  if (candidate.status === "error" && typeof candidate.error_code === "string") {
    return candidate.error_code;
  }

  if (typeof candidate.error_code === "string") {
    return candidate.error_code;
  }

  if (typeof candidate.error === "string") {
    return candidate.error;
  }

  return undefined;
}

function parseBridgePollStatus(
  pollResponse: WorldBridgePollResponse,
  normalizedResult: unknown,
  rawResult: unknown,
): WorldBridgePollStatus {
  switch (pollResponse.status) {
    case "initialized":
      return { type: "waiting_for_connection" };
    case "retrieved":
      return { type: "awaiting_confirmation" };
    case "completed": {
      const error = normalizeBridgeError(normalizedResult);
      if (error) {
        return {
          type: "failed",
          error,
          rawResult,
        };
      }

      return {
        type: "confirmed",
        result: normalizedResult,
        rawResult,
      };
    }
    default:
      return {
        type: "failed",
        error: "unexpected_response",
        rawResult,
      };
  }
}

function createConnectorUri(requestId: string, keyBase64: string, connectBaseUrl: string): string {
  const url = new URL("/verify", connectBaseUrl);
  url.searchParams.set("t", "wld");
  url.searchParams.set("i", requestId);
  url.searchParams.set("k", keyBase64);
  return url.toString();
}

async function postWorldBridgeRequest(
  bridgeBaseUrl: string,
  encryptedPayload: WorldBridgeEncryptedPayload,
  fetchImplementation: WorldFetchImplementation,
): Promise<WorldBridgeCreateResponse> {
  const response = await fetchImplementation(`${bridgeBaseUrl}/request`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(encryptedPayload),
  });

  const json = (await response.json()) as Partial<WorldBridgeCreateResponse>;

  if (!response.ok || typeof json.request_id !== "string") {
    throw new Error("Failed to create a World bridge request.");
  }

  return json as WorldBridgeCreateResponse;
}

async function fetchWorldBridgePollResponse(
  bridgeBaseUrl: string,
  requestId: string,
  fetchImplementation: WorldFetchImplementation,
): Promise<WorldBridgePollResponse> {
  const response = await fetchImplementation(`${bridgeBaseUrl}/response/${requestId}`, {
    headers: {
      accept: "application/json",
    },
  });

  const json = (await response.json()) as Partial<WorldBridgePollResponse>;

  if (!response.ok || typeof json.status !== "string") {
    throw new Error("Failed to poll the World bridge.");
  }

  return json as WorldBridgePollResponse;
}

class WorldBridgeRequest {
  readonly requestId: string;
  readonly connectorURI: string;

  constructor(
    private readonly pollRequest: {
      bridgeBaseUrl: string;
      fetchImplementation: WorldFetchImplementation;
      keyBytes: Uint8Array;
      context: {
        action: string;
        environment: string;
        nonce: Hex;
        signalHash?: Hex;
      };
      requestId: string;
      connectorURI: string;
    },
  ) {
    this.requestId = pollRequest.requestId;
    this.connectorURI = pollRequest.connectorURI;
  }

  async pollOnce(): Promise<WorldBridgePollStatus> {
    const pollResponse = await fetchWorldBridgePollResponse(
      this.pollRequest.bridgeBaseUrl,
      this.pollRequest.requestId,
      this.pollRequest.fetchImplementation,
    );

    if (pollResponse.status === "initialized" || pollResponse.status === "retrieved") {
      return parseBridgePollStatus(pollResponse, null, null);
    }

    if (!pollResponse.response || typeof pollResponse.response !== "object") {
      return {
        type: "failed",
        error: "unexpected_response",
      };
    }

    const decrypted = await decryptBridgePayload(
      pollResponse.response as WorldBridgeEncryptedPayload,
      this.pollRequest.keyBytes,
    );
    const normalized = normalizeBridgeResult(decrypted, this.pollRequest.context);

    return parseBridgePollStatus(pollResponse, normalized, decrypted);
  }

  async pollUntilCompletion(options?: {
    pollInterval?: number;
    timeout?: number;
    signal?: AbortSignal;
  }): Promise<WorldBridgeCompletion> {
    const pollInterval = options?.pollInterval ?? WORLD_BRIDGE_DEFAULT_POLL_INTERVAL_MS;
    const timeout = options?.timeout ?? WORLD_BRIDGE_DEFAULT_TIMEOUT_MS;
    const start = Date.now();

    while (true) {
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: "cancelled",
        };
      }

      if (Date.now() - start > timeout) {
        return {
          success: false,
          error: "timeout",
        };
      }

      const status = await this.pollOnce();

      if (status.type === "confirmed") {
        return {
          success: true,
          result: status.result,
          rawResult: status.rawResult,
        };
      }

      if (status.type === "failed") {
        return {
          success: false,
          error: status.error,
          rawResult: status.rawResult,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
}

export async function createWorldBridgeRequest(
  input: CreateWorldBridgeRequestInput,
): Promise<WorldBridgeRequest> {
  const fetchImplementation = input.fetchImplementation ?? fetch;
  const bridgeBaseUrl =
    input.bridgeBaseUrl?.replace(/\/+$/, "") ?? WORLD_DEFAULT_BRIDGE_BASE_URL;
  const connectBaseUrl =
    input.connectBaseUrl?.replace(/\/+$/, "") ?? WORLD_DEFAULT_CONNECT_BASE_URL;
  const environment = input.environment ?? "production";
  const payload = createWorldBridgeV4Payload({
    appId: input.appId,
    action: input.action,
    rpContext: input.rpContext,
    signal: input.signal,
    genesisIssuedAtMin: input.genesisIssuedAtMin,
    environment,
  });

  const { keyBase64, keyBytes, encryptedPayload } = await encryptBridgePayload(
    JSON.stringify(payload),
  );
  const { request_id: requestId } = await postWorldBridgeRequest(
    bridgeBaseUrl,
    encryptedPayload,
    fetchImplementation,
  );

  return new WorldBridgeRequest({
    bridgeBaseUrl,
    fetchImplementation,
    keyBytes,
    requestId,
    connectorURI: createConnectorUri(requestId, keyBase64, connectBaseUrl),
    context: {
      action: input.action,
      environment,
      nonce: input.rpContext.nonce,
      signalHash:
        typeof input.signal === "string" && input.signal.length > 0
          ? hashWorldSignal(input.signal)
          : undefined,
    },
  });
}
