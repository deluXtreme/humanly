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

export type SupportedAuctionChain = "base" | "base-sepolia";

export interface AuctionEndpointInfoResponse {
  chain: {
    key: SupportedAuctionChain;
    chainId: number;
    name: string;
    currencySymbol: "USDC";
    currencyDecimals: 6;
    x402Network: `eip155:${number}`;
  };
  auction: Hex;
  bidFunction: {
    signature: "submitBid(uint256,uint128,address,uint256,bytes)";
    args: [
      "maxPrice",
      "amount",
      "bidder",
      "prevTickPrice",
      "innerHookData",
    ];
  };
  supportedActions: {
    previewBid: true;
    buildBidTx: true;
    hostedSubmission: false;
  };
  paymentMode: "cloudflare_x402_when_configured";
  note: string;
}

export interface AuctionBidRequestBody {
  bidder: Hex;
  amount: string;
  maxPrice: string;
  prevTickPrice?: string;
  hookData?: Hex;
  value?: string;
}

export interface NormalizedAuctionBidRequest {
  bidder: Hex;
  amount: string;
  maxPrice: string;
  prevTickPrice: string;
  hookData: Hex;
  value: string;
}

export interface BuiltAuctionBidTransaction {
  chain: {
    key: SupportedAuctionChain;
    chainId: number;
    name: string;
  };
  to: Hex;
  data: Hex;
  value: string;
}

export interface AuctionBidSimulationResult {
  attempted: boolean;
  ok: boolean;
  error?: string;
}

export interface AuctionBidPreviewResponse {
  chain: {
    key: SupportedAuctionChain;
    chainId: number;
    name: string;
  };
  auction: Hex;
  normalizedRequest: NormalizedAuctionBidRequest;
  transaction: BuiltAuctionBidTransaction;
  simulation: AuctionBidSimulationResult;
  note: string;
}

export interface AuctionBuildBidTxResponse {
  chain: {
    key: SupportedAuctionChain;
    chainId: number;
    name: string;
  };
  auction: Hex;
  normalizedRequest: NormalizedAuctionBidRequest;
  transaction: BuiltAuctionBidTransaction;
}

export type AuctionBidSimulationImplementation = (
  chain: SupportedAuctionChain,
  auction: Hex,
  request: NormalizedAuctionBidRequest,
) => Promise<AuctionBidSimulationResult>;

export interface HandleApiAuctionRequestOptions {
  simulateAuctionBidImplementation?: AuctionBidSimulationImplementation;
}

export type ApiRouterOptions =
  HandleApiWorldRequestOptions & HandleApiAuctionRequestOptions;
