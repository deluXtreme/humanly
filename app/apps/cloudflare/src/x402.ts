import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";

import type { HumanlyCloudflareEnv } from "./types.ts";

const DEFAULT_X402_NETWORK = "eip155:84532" as const;
const DEFAULT_X402_FACILITATOR_URL = "https://x402.org/facilitator";
const DEFAULT_X402_AUCTION_INFO_PRICE = "$0.001";
const DEFAULT_X402_AUCTION_ACTION_PRICE = "$0.01";

function isValidX402Network(value: string): value is `eip155:${number}` {
  return /^eip155:\d+$/.test(value);
}

function isValidEvmAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function createAuctionPaymentMiddleware(env: HumanlyCloudflareEnv) {
  if (isTruthy(env.X402_DISABLED)) {
    return null;
  }

  if (!env.X402_PAY_TO || env.X402_PAY_TO.trim().length === 0) {
    throw new Error(
      "X402_PAY_TO must be configured unless X402_DISABLED=true.",
    );
  }

  if (!isValidEvmAddress(env.X402_PAY_TO)) {
    throw new Error("X402_PAY_TO must be a valid 0x-prefixed address.");
  }

  const network = env.X402_NETWORK ?? DEFAULT_X402_NETWORK;
  if (!isValidX402Network(network)) {
    throw new Error("X402_NETWORK must look like eip155:<chainId>.");
  }

  const payTo = env.X402_PAY_TO;
  const facilitatorClient = new HTTPFacilitatorClient({
    url: env.X402_FACILITATOR_URL ?? DEFAULT_X402_FACILITATOR_URL,
  });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    network,
    new ExactEvmScheme(),
  );

  return paymentMiddleware(
    {
      "GET /api/auctions/*": {
        accepts: {
          scheme: "exact",
          price: env.X402_AUCTION_INFO_PRICE ?? DEFAULT_X402_AUCTION_INFO_PRICE,
          network,
          payTo,
        },
        description: "Humanly auction discovery and metadata access",
      },
      "POST /api/auctions/*/preview-bid": {
        accepts: {
          scheme: "exact",
          price:
            env.X402_AUCTION_ACTION_PRICE ?? DEFAULT_X402_AUCTION_ACTION_PRICE,
          network,
          payTo,
        },
        description: "Humanly auction bid preview",
      },
      "POST /api/auctions/*/build-bid-tx": {
        accepts: {
          scheme: "exact",
          price:
            env.X402_AUCTION_ACTION_PRICE ?? DEFAULT_X402_AUCTION_ACTION_PRICE,
          network,
          payTo,
        },
        description: "Humanly auction transaction builder",
      },
    },
    resourceServer,
  );
}
