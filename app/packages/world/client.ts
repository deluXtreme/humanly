import {
  WORLD_LEGACY_PROTOCOL_VERSION,
  WORLD_ORB_VERIFICATION_LEVEL,
} from "./constants.ts";
import type {
  CreateHybridWorldIdRequestInput,
  CreateWorldRpContextInput,
  CreateWorldVerifyRequestPayloadInput,
  HybridWorldIdRequest,
  WorldRpContext,
  WorldVerifyRequestPayload,
} from "./types.ts";

export function createWorldRpContext(
  input: CreateWorldRpContextInput,
): WorldRpContext {
  return {
    rp_id: input.rpId,
    nonce: input.signature.nonce,
    created_at: input.signature.createdAt,
    expires_at: input.signature.expiresAt,
    signature: input.signature.sig,
  };
}

export function createHybridWorldIdRequest(
  input: CreateHybridWorldIdRequestInput,
): HybridWorldIdRequest {
  const request: HybridWorldIdRequest = {
    app_id: input.appId,
    action: input.action,
    verification_level:
      input.verificationLevel ?? WORLD_ORB_VERIFICATION_LEVEL,
    allow_legacy_proofs: true,
    rp_context: input.rpContext,
  };

  if (input.signal) {
    request.signal = input.signal;
  }

  return request;
}

export function createWorldVerifyRequestPayload(
  input: CreateWorldVerifyRequestPayloadInput,
): WorldVerifyRequestPayload {
  const payload: WorldVerifyRequestPayload = {
    protocol_version: input.protocolVersion ?? WORLD_LEGACY_PROTOCOL_VERSION,
    nonce: input.nonce,
    responses: input.responses,
  };

  if (input.action) {
    payload.action = input.action;
  }

  if (input.environment) {
    payload.environment = input.environment;
  }

  return payload;
}
