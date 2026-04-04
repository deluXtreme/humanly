import { WORLD_LEGACY_PROTOCOL_VERSION } from "./constants.ts";
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
    allow_legacy_proofs: input.allowLegacyProofs ?? false,
    rp_context: input.rpContext,
  };

  if (input.verificationLevel) {
    request.verification_level = input.verificationLevel;
  }

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
