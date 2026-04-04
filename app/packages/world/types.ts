export type Hex = `0x${string}`;
export type WorldTimestamp = number | `${number}`;

export type WorldAppId = `app_${string}`;
export type WorldRpId = `rp_${string}`;
export type WorldVerificationLevel = "orb";
export type WorldProofProtocolVersion = "3.0" | "4.0";
export type WorldVerificationMode = "cloud_v4" | "onchain_v3" | "hybrid";

export interface WorldRpSignature {
  sig: Hex;
  nonce: Hex;
  createdAt: WorldTimestamp;
  expiresAt: WorldTimestamp;
}

export interface WorldRpContext {
  rp_id: WorldRpId;
  nonce: Hex;
  created_at: WorldTimestamp;
  expires_at: WorldTimestamp;
  signature: Hex;
}

export interface CreateWorldRpContextInput {
  rpId: WorldRpId;
  signature: WorldRpSignature;
}

export interface SignWorldRpRequestInput {
  signingKeyHex: Hex;
  action?: string;
  ttl?: number;
}

export type WorldObjectSignRequestImplementation = (
  params: SignWorldRpRequestInput,
) => WorldRpSignature | Promise<WorldRpSignature>;

export type WorldLegacySignRequestImplementation = (
  action: string | undefined,
  signingKeyHex: Hex,
  ttl?: number,
) => WorldRpSignature | Promise<WorldRpSignature>;

export type WorldSignRequestImplementation =
  | WorldObjectSignRequestImplementation
  | WorldLegacySignRequestImplementation;

export interface SignWorldRpRequestOptions {
  signRequestImplementation?: WorldSignRequestImplementation;
}

export interface CreateSignedWorldRpContextInput extends SignWorldRpRequestInput {
  rpId: WorldRpId;
}

export interface HybridWorldIdRequest {
  app_id: WorldAppId;
  action: string;
  verification_level: WorldVerificationLevel;
  allow_legacy_proofs: true;
  rp_context: WorldRpContext;
  signal?: string;
}

export interface CreateHybridWorldIdRequestInput {
  appId: WorldAppId;
  action: string;
  rpContext: WorldRpContext;
  signal?: string;
  verificationLevel?: WorldVerificationLevel;
}

export interface WorldLegacyProofResponse {
  identifier: string;
  merkle_root: Hex;
  nullifier: Hex;
  proof: Hex;
  signal_hash?: Hex;
  max_age?: number;
}

export interface WorldVerifyRequestPayload {
  protocol_version: WorldProofProtocolVersion;
  nonce: string;
  action?: string;
  responses: WorldLegacyProofResponse[];
  environment?: string;
}

export interface CreateWorldVerifyRequestPayloadInput {
  nonce: string;
  action?: string;
  responses: WorldLegacyProofResponse[];
  protocolVersion?: WorldProofProtocolVersion;
  environment?: string;
}

export interface WorldVerifyResult {
  identifier?: string;
  success: boolean;
  nullifier?: string;
  code?: string;
  detail?: string;
}

export interface WorldVerifyResponse {
  success: boolean;
  results?: WorldVerifyResult[];
  action?: string;
  nullifier?: string;
  created_at?: string;
  environment?: string;
  session_id?: string;
  message?: string;
}

export type WorldFetchImplementation = (
  input: Request | URL | string,
  init?: RequestInit,
) => Promise<Response>;

export interface VerifyWorldProofOptions {
  rpId: WorldRpId;
  apiBaseUrl?: string;
  fetchImplementation?: WorldFetchImplementation;
}

export interface LegacyWorldIdVerificationInput {
  root: bigint;
  groupId: bigint;
  signalHash: bigint;
  nullifierHash: bigint;
  externalNullifierHash: bigint;
  proof: readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
}

export interface CreateLegacyWorldIdVerificationInput {
  root: Hex;
  signalHash: Hex;
  nullifierHash: Hex;
  externalNullifierHash: Hex | bigint;
  proof: Hex;
}

export interface HybridWorldVerificationRecord {
  walletAddress: string;
  worldVerified: boolean;
  verificationMode: WorldVerificationMode;
  verifiedAt: string;
  nullifier?: string;
  sessionId?: string;
}

export interface WorldV4ProofResponse {
  identifier: string;
  signal_hash?: Hex;
  proof: readonly [Hex, Hex, Hex, Hex, Hex] | Hex[];
  nullifier: Hex;
  issuer_schema_id: number;
  expires_at_min: number;
  credential_genesis_issued_at_min?: number;
}

export interface WorldUniquenessResultV4 {
  protocol_version: "4.0";
  nonce: Hex;
  action: string;
  responses: WorldV4ProofResponse[];
  environment: string;
}

export type WorldIdKitResult = WorldUniquenessResultV4;

export interface WorldUniquenessVerificationInput {
  nullifier: bigint;
  action: bigint;
  rpId: bigint;
  nonce: bigint;
  signalHash: bigint;
  expiresAtMin: bigint;
  issuerSchemaId: bigint;
  credentialGenesisIssuedAtMin: bigint;
  zeroKnowledgeProof: readonly [bigint, bigint, bigint, bigint, bigint];
}

export interface CreateWorldUniquenessVerificationInput {
  result: WorldUniquenessResultV4;
  rpId: WorldRpId | string;
  responseIndex?: number;
}

export interface WorldBridgeProofRequestConstraint {
  identifier: "proof_of_human";
  issuer_schema_id: 1;
  genesis_issued_at_min: number | null;
  expires_at_min: number | null;
}

export interface WorldBridgeProofRequest {
  action: Hex;
  created_at: number;
  expires_at: number;
  id: string;
  nonce: Hex;
  oprf_key_id: Hex;
  proof_requests: WorldBridgeProofRequestConstraint[];
  rp_id: WorldRpId;
  session_id: null;
  signature: Hex;
  version: 1;
}

export interface WorldBridgeCreateRequestPayload {
  action: string;
  allow_legacy_proofs: false;
  app_id: WorldAppId;
  environment: string;
  proof_request: WorldBridgeProofRequest;
  signal?: Hex;
}

export interface CreateWorldBridgeV4PayloadInput {
  appId: WorldAppId;
  action: string;
  rpContext: WorldRpContext;
  signal?: string;
  genesisIssuedAtMin?: number;
  environment: string;
  proofRequestId?: string;
}

export interface WorldBridgeEncryptedPayload {
  iv: string;
  payload: string;
}

export interface WorldBridgeCreateResponse {
  request_id: string;
}

export interface WorldBridgePollResponse {
  status: string;
  response: WorldBridgeEncryptedPayload | null;
}

export interface CreateWorldBridgeRequestInput {
  appId: WorldAppId;
  action: string;
  rpContext: WorldRpContext;
  signal?: string;
  genesisIssuedAtMin?: number;
  environment?: string;
  bridgeBaseUrl?: string;
  connectBaseUrl?: string;
  fetchImplementation?: WorldFetchImplementation;
}

export type WorldBridgePollStatus =
  | { type: "waiting_for_connection" }
  | { type: "awaiting_confirmation" }
  | { type: "confirmed"; result: unknown; rawResult: unknown }
  | { type: "failed"; error: string; rawResult?: unknown };

export type WorldBridgeCompletion =
  | { success: true; result: unknown; rawResult: unknown }
  | { success: false; error: string; rawResult?: unknown };
