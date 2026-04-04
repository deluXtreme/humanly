import type {
  Hex,
  HybridWorldIdRequest,
  SignWorldRpRequestOptions,
  VerifyWorldProofOptions,
  WorldAppId,
  WorldLegacyProofResponse,
  WorldProofProtocolVersion,
  WorldRpId,
  WorldVerificationLevel,
} from "world";

export interface ApiWorldConfig {
  appId: WorldAppId;
  rpId: WorldRpId;
  signingKeyHex: Hex;
  allowedActions: readonly string[];
  rpContextTtlSeconds?: number;
  verifyApiBaseUrl?: string;
}

export interface ApiWorldEnv {
  WORLD_APP_ID?: string;
  WORLD_RP_ID?: string;
  WORLD_RP_SIGNING_KEY?: string;
  WORLD_ALLOWED_ACTIONS?: string;
  WORLD_RP_TTL_SECONDS?: string;
  WORLD_VERIFY_API_BASE_URL?: string;
}

export interface WorldRpContextRequestBody {
  action: string;
  signal?: string;
  verificationLevel?: WorldVerificationLevel;
  ttl?: number;
}

export type WorldRpContextResponse = HybridWorldIdRequest;

export interface WorldVerifyRequestBody {
  nonce: Hex;
  action: string;
  responses: WorldLegacyProofResponse[];
  protocolVersion?: WorldProofProtocolVersion;
}

export interface HandleApiWorldRequestOptions
  extends SignWorldRpRequestOptions,
    Pick<VerifyWorldProofOptions, "fetchImplementation"> {
  config: ApiWorldConfig;
}

export type ApiRouterOptions = HandleApiWorldRequestOptions;
