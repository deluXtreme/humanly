import { createWorldRpContext } from "./client.ts";
import {
  WORLD_DEFAULT_VERIFY_API_BASE_URL,
  WORLD_DEFAULT_VERIFY_USER_AGENT,
} from "./constants.ts";
import type {
  CreateSignedWorldRpContextInput,
  SignWorldRpRequestInput,
  SignWorldRpRequestOptions,
  VerifyWorldProofOptions,
  WorldLegacySignRequestImplementation,
  WorldObjectSignRequestImplementation,
  WorldRpContext,
  WorldRpSignature,
  WorldSignRequestImplementation,
  WorldVerifyRequestPayload,
  WorldVerifyResponse,
} from "./types.ts";

export function createWorldVerifyUrl(
  rpId: string,
  apiBaseUrl: string = WORLD_DEFAULT_VERIFY_API_BASE_URL,
): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/${rpId}`;
}

export async function verifyWorldProof(
  payload: WorldVerifyRequestPayload,
  options: VerifyWorldProofOptions,
): Promise<WorldVerifyResponse> {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const response = await fetchImplementation(
    createWorldVerifyUrl(options.rpId, options.apiBaseUrl),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": WORLD_DEFAULT_VERIFY_USER_AGENT,
      },
      body: JSON.stringify(payload),
    },
  );

  const rawBody = await response.text();
  let json: WorldVerifyResponse | undefined;

  try {
    json = JSON.parse(rawBody) as WorldVerifyResponse;
  } catch {
    if (!response.ok) {
      throw new Error(
        `World verification failed with status ${response.status}.`,
      );
    }

    throw new Error("World verification returned a non-JSON response.");
  }

  if (!response.ok) {
    const message =
      json.message ??
      json.results?.find((result) => result.detail)?.detail ??
      `World verification failed with status ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export function isWorldVerificationSuccessful(
  response: WorldVerifyResponse,
): boolean {
  return response.success === true;
}

async function loadWorldSignRequestImplementation(): Promise<WorldSignRequestImplementation> {
  try {
    const module = (await import("@worldcoin/idkit-server")) as {
      signRequest?: unknown;
    };

    if (typeof module.signRequest !== "function") {
      throw new Error(
        "`@worldcoin/idkit-server` does not export a callable `signRequest` function.",
      );
    }

    return module.signRequest as WorldSignRequestImplementation;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown import failure";
    throw new Error(
      `Unable to load @worldcoin/idkit-server. Install workspace dependencies before using World RP signing. ${message}`,
    );
  }
}

function isLegacySignRequestImplementation(
  implementation: WorldSignRequestImplementation,
): implementation is WorldLegacySignRequestImplementation {
  return implementation.length > 1;
}

function normalizeWorldRpSignature(signature: WorldRpSignature): WorldRpSignature {
  return {
    sig: signature.sig,
    nonce: signature.nonce,
    createdAt: signature.createdAt,
    expiresAt: signature.expiresAt,
  };
}

export async function signWorldRpRequest(
  input: SignWorldRpRequestInput,
  options: SignWorldRpRequestOptions = {},
): Promise<WorldRpSignature> {
  const signRequest =
    options.signRequestImplementation ??
    (await loadWorldSignRequestImplementation());

  if (isLegacySignRequestImplementation(signRequest)) {
    return normalizeWorldRpSignature(
      await signRequest(input.action, input.signingKeyHex, input.ttl),
    );
  }

  return normalizeWorldRpSignature(
    await (signRequest as WorldObjectSignRequestImplementation)(input),
  );
}

export async function createSignedWorldRpContext(
  input: CreateSignedWorldRpContextInput,
  options: SignWorldRpRequestOptions = {},
): Promise<WorldRpContext> {
  const signature = await signWorldRpRequest(
    {
      signingKeyHex: input.signingKeyHex,
      action: input.action,
      ttl: input.ttl,
    },
    options,
  );

  return createWorldRpContext({
    rpId: input.rpId,
    signature,
  });
}
