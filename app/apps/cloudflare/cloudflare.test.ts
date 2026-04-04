import { describe, expect, test } from "bun:test";

import { createCloudflareFetchHandler } from "./src/index.ts";
import type { HumanlyCloudflareEnv } from "./src/types.ts";

function createTestEnv(): HumanlyCloudflareEnv {
  return {
    WORLD_APP_ID: "app_demo",
    WORLD_RP_ID: "rp_1234567890abcdef",
    WORLD_RP_SIGNING_KEY:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    WORLD_ALLOWED_ACTIONS: "create-auction",
    WORLD_ACTION: "create-auction",
    API_BASE_URL: "",
    HUMANLY_CCA_ADDRESS: "0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57",
    X402_PAY_TO: "0x0000000000000000000000000000000000000001",
    X402_NETWORK: "eip155:84532",
    X402_AUCTION_INFO_PRICE: "$0.001",
    X402_AUCTION_ACTION_PRICE: "$0.01",
    X402_FACILITATOR_URL: "https://facilitator.x402.org",
    ASSETS: {
      async fetch(input: Request | URL | string): Promise<Response> {
        const request =
          typeof input === "string" || input instanceof URL
            ? new Request(input)
            : input;

        return new Response(`asset:${new URL(request.url).pathname}`, {
          status: 200,
        });
      },
    },
  };
}

describe("cloudflare worker", () => {
  test("serves healthz from the worker", async () => {
    const fetchHandler = createCloudflareFetchHandler();
    const response = await fetchHandler(
      new Request("https://human.ly/healthz"),
      createTestEnv(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "humanly-cloudflare",
    });
  });

  test("serves browser config from the worker", async () => {
    const fetchHandler = createCloudflareFetchHandler();
    const response = await fetchHandler(
      new Request("https://human.ly/config.json"),
      createTestEnv(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      apiBaseUrl: "",
      worldAction: "create-auction",
      worldRpId: "rp_1234567890abcdef",
    });
  });

  test("passes non-api requests through to static assets", async () => {
    const fetchHandler = createCloudflareFetchHandler();
    const response = await fetchHandler(
      new Request("https://human.ly/"),
      createTestEnv(),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("asset:/");
  });

  test("protects auction routes with x402 when configured", async () => {
    const fetchHandler = createCloudflareFetchHandler({
      auctionPaymentMiddleware: async (_context) =>
        new Response("Payment required", {
          status: 402,
        }),
    });
    const response = await fetchHandler(
      new Request(
        "https://human.ly/api/auctions/base/0x000000000000000000000000000000000000dEaD",
      ),
      createTestEnv(),
    );

    expect(response.status).toBe(402);
  });

  test("only bypasses x402 when explicitly disabled", async () => {
    const fetchHandler = createCloudflareFetchHandler();
    const env = createTestEnv();
    delete env.X402_PAY_TO;
    env.X402_DISABLED = "true";

    const response = await fetchHandler(
      new Request(
        "https://human.ly/api/auctions/base/0x000000000000000000000000000000000000dEaD",
      ),
      env,
    );

    expect(response.status).toBe(200);
  });
});
