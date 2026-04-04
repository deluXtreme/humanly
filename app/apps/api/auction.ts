import {
  BaseError,
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
  isHex,
  type Hex,
} from "viem";

import type {
  AuctionBidPreviewResponse,
  AuctionBidRequestBody,
  AuctionBidSimulationImplementation,
  AuctionBidSimulationResult,
  AuctionBuildBidTxResponse,
  AuctionEndpointInfoResponse,
  BuiltAuctionBidTransaction,
  HandleApiAuctionRequestOptions,
  NormalizedAuctionBidRequest,
  SupportedAuctionChain,
} from "./types.ts";

const UINT128_MAX = (1n << 128n) - 1n;
const UINT256_MAX = (1n << 256n) - 1n;

const AUCTION_BID_ABI = [
  {
    type: "function",
    name: "submitBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "maxPrice", type: "uint256" },
      { name: "amount", type: "uint128" },
      { name: "bidder", type: "address" },
      { name: "prevTickPrice", type: "uint256" },
      { name: "innerHookData", type: "bytes" },
    ],
    outputs: [{ name: "bidId", type: "uint256" }],
  },
] as const;

const SUPPORTED_AUCTION_CHAINS = {
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    currencySymbol: "USDC",
    currencyDecimals: 6,
    x402Network: "eip155:8453",
  },
  "base-sepolia": {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    currencySymbol: "USDC",
    currencyDecimals: 6,
    x402Network: "eip155:84532",
  },
} as const satisfies Record<
  SupportedAuctionChain,
  {
    chainId: number;
    name: string;
    rpcUrl: string;
    currencySymbol: "USDC";
    currencyDecimals: 6;
    x402Network: `eip155:${number}`;
  }
>;

type AuctionAction = "preview-bid" | "build-bid-tx";

interface AuctionRouteMatch {
  chain: string;
  auction: string;
  action?: AuctionAction;
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function createJsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

function createNoContentResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function createMethodNotAllowedResponse(methods: string): Response {
  return createJsonResponse(
    { error: `Method not allowed. Use ${methods}.` },
    405,
  );
}

function createBadRequestResponse(message: string): Response {
  return createJsonResponse({ error: message }, 400);
}

function isSupportedAuctionChain(value: string): value is SupportedAuctionChain {
  return value in SUPPORTED_AUCTION_CHAINS;
}

function parseRequiredIntegerString(
  value: string | undefined,
  field: string,
  max: bigint,
): string {
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`${field} must be a base-10 integer string.`);
  }

  const parsed = BigInt(value);

  if (parsed <= 0n) {
    throw new Error(`${field} must be greater than zero.`);
  }

  if (parsed > max) {
    throw new Error(`${field} exceeds the allowed onchain range.`);
  }

  return parsed.toString();
}

function parseOptionalIntegerString(
  value: string | undefined,
  field: string,
  max: bigint,
  fallback: string,
): string {
  if (!value) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${field} must be a base-10 integer string.`);
  }

  const parsed = BigInt(value);

  if (parsed < 0n) {
    throw new Error(`${field} must be zero or greater.`);
  }

  if (parsed > max) {
    throw new Error(`${field} exceeds the allowed onchain range.`);
  }

  return parsed.toString();
}

function normalizeAuctionBidRequest(
  body: AuctionBidRequestBody,
): NormalizedAuctionBidRequest {
  if (!body.bidder || !isAddress(body.bidder)) {
    throw new Error("`bidder` must be a valid 0x-prefixed address.");
  }

  const hookData = body.hookData ?? "0x";
  if (!isHex(hookData)) {
    throw new Error("`hookData` must be valid hex bytes.");
  }

  return {
    bidder: getAddress(body.bidder),
    amount: parseRequiredIntegerString(body.amount, "amount", UINT128_MAX),
    maxPrice: parseRequiredIntegerString(body.maxPrice, "maxPrice", UINT256_MAX),
    prevTickPrice: parseOptionalIntegerString(
      body.prevTickPrice,
      "prevTickPrice",
      UINT256_MAX,
      "0",
    ),
    hookData,
    value: parseOptionalIntegerString(body.value, "value", UINT256_MAX, "0"),
  };
}

function buildAuctionBidTransaction(
  chain: SupportedAuctionChain,
  auction: Hex,
  request: NormalizedAuctionBidRequest,
): BuiltAuctionBidTransaction {
  const config = SUPPORTED_AUCTION_CHAINS[chain];

  return {
    chain: {
      key: chain,
      chainId: config.chainId,
      name: config.name,
    },
    to: auction,
    data: encodeFunctionData({
      abi: AUCTION_BID_ABI,
      functionName: "submitBid",
      args: [
        BigInt(request.maxPrice),
        BigInt(request.amount),
        request.bidder,
        BigInt(request.prevTickPrice),
        request.hookData,
      ],
    }),
    value: request.value,
  };
}

async function defaultSimulateAuctionBid(
  chain: SupportedAuctionChain,
  auction: Hex,
  request: NormalizedAuctionBidRequest,
): Promise<AuctionBidSimulationResult> {
  const config = SUPPORTED_AUCTION_CHAINS[chain];
  const publicClient = createPublicClient({
    transport: http(config.rpcUrl),
  });

  try {
    await publicClient.simulateContract({
      address: auction,
      abi: AUCTION_BID_ABI,
      functionName: "submitBid",
      args: [
        BigInt(request.maxPrice),
        BigInt(request.amount),
        request.bidder,
        BigInt(request.prevTickPrice),
        request.hookData,
      ],
      account: request.bidder,
    });

    return {
      attempted: true,
      ok: true,
    };
  } catch (error) {
    const message =
      error instanceof BaseError
        ? error.shortMessage
        : error instanceof Error
          ? error.message
          : "Unknown simulation error";

    return {
      attempted: true,
      ok: false,
      error: message,
    };
  }
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function parseAuctionAddress(value: string): Hex {
  if (!isAddress(value)) {
    throw new Error("Auction path parameter must be a valid 0x-prefixed address.");
  }

  return getAddress(value);
}

function getAuctionEndpointInfo(
  chain: SupportedAuctionChain,
  auction: Hex,
): AuctionEndpointInfoResponse {
  const config = SUPPORTED_AUCTION_CHAINS[chain];

  return {
    chain: {
      key: chain,
      chainId: config.chainId,
      name: config.name,
      currencySymbol: config.currencySymbol,
      currencyDecimals: config.currencyDecimals,
      x402Network: config.x402Network,
    },
    auction,
    bidFunction: {
      signature: "submitBid(uint256,uint128,address,uint256,bytes)",
      args: ["maxPrice", "amount", "bidder", "prevTickPrice", "innerHookData"],
    },
    supportedActions: {
      previewBid: true,
      buildBidTx: true,
      hostedSubmission: false,
    },
    paymentMode: "cloudflare_x402_when_configured",
    note:
      "Scaffold endpoint only. The repo does not yet contain the read ABI for CCA state, so this route describes the supported bid-entrypoint rather than returning live auction state.",
  };
}

export function matchAuctionRoute(pathname: string): AuctionRouteMatch | null {
  const match = pathname.match(
    /^\/api\/auctions\/([^/]+)\/([^/]+)(?:\/(preview-bid|build-bid-tx))?$/,
  );

  if (!match) {
    return null;
  }

  const chain = match[1]!;
  const auction = match[2]!;
  const action = match[3];
  return {
    chain,
    auction,
    action: action as AuctionAction | undefined,
  };
}

export async function handleAuctionRequest(
  request: Request,
  match: AuctionRouteMatch,
  options: HandleApiAuctionRequestOptions = {},
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return createNoContentResponse();
  }

  try {
    if (!isSupportedAuctionChain(match.chain)) {
      throw new Error(
        `Unsupported auction chain: ${match.chain}. Supported values are ${Object.keys(
          SUPPORTED_AUCTION_CHAINS,
        ).join(", ")}.`,
      );
    }

    const auction = parseAuctionAddress(match.auction);
    const simulateBid =
      options.simulateAuctionBidImplementation ?? defaultSimulateAuctionBid;

    if (!match.action) {
      if (request.method !== "GET") {
        return createMethodNotAllowedResponse("GET");
      }

      return createJsonResponse(getAuctionEndpointInfo(match.chain, auction), 200);
    }

    if (request.method !== "POST") {
      return createMethodNotAllowedResponse("POST");
    }

    const body = await parseJsonBody<AuctionBidRequestBody>(request);
    const normalizedRequest = normalizeAuctionBidRequest(body);
    const transaction = buildAuctionBidTransaction(
      match.chain,
      auction,
      normalizedRequest,
    );

    if (match.action === "build-bid-tx") {
      const response: AuctionBuildBidTxResponse = {
        chain: transaction.chain,
        auction,
        normalizedRequest,
        transaction,
      };

      return createJsonResponse(response, 200);
    }

    const simulation = await simulateBid(match.chain, auction, normalizedRequest);
    const response: AuctionBidPreviewResponse = {
      chain: transaction.chain,
      auction,
      normalizedRequest,
      transaction,
      simulation,
      note:
        "Preview endpoint only. Humanly does not custody funds or submit the bid in v1; agents are expected to use the returned transaction request directly.",
    };

    return createJsonResponse(response, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process auction request.";
    return createBadRequestResponse(message);
  }
}
