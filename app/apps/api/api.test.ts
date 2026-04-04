import { describe, expect, test } from "bun:test";
import type { WorldFetchImplementation } from "world";

import {
  createApiRouter,
  createApiWorldConfig,
  handleWorldRpContextRequest,
  handleWorldVerifyRequest,
} from "./index.ts";

describe("api app", () => {
  const config = createApiWorldConfig({
    WORLD_APP_ID: "app_demo",
    WORLD_RP_ID: "rp_demo",
    WORLD_RP_SIGNING_KEY:
      "0x3333333333333333333333333333333333333333333333333333333333333333",
    WORLD_ALLOWED_ACTIONS: "create-auction,place-bid",
    WORLD_RP_TTL_SECONDS: "600",
  });

  test("creates API world config from environment variables", () => {
    expect(config.appId).toBe("app_demo");
    expect(config.rpId).toBe("rp_demo");
    expect(config.allowedActions).toEqual(["create-auction", "place-bid"]);
    expect(config.rpContextTtlSeconds).toBe(600);
  });

  test("builds a full IDKit request from the RP context handler", async () => {
    const request = new Request("https://human.ly/api/worldid/rp-context", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "create-auction",
        signal: "0xCreator",
      }),
    });

    const response = await handleWorldRpContextRequest(request, {
      config,
      signRequestImplementation: () => ({
        sig: "0xeeee" as const,
        nonce: "0xffff" as const,
        createdAt: 1_775_186_400,
        expiresAt: 1_775_186_700,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      app_id: "app_demo",
      action: "create-auction",
      verification_level: "orb",
      allow_legacy_proofs: true,
      signal: "0xCreator",
      rp_context: {
        rp_id: "rp_demo",
        nonce: "0xffff",
        created_at: 1_775_186_400,
        expires_at: 1_775_186_700,
        signature: "0xeeee",
      },
    });
  });

  test("verifies World proofs through the HTTP handler", async () => {
    const request = new Request("https://human.ly/api/worldid/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nonce: "nonce-demo",
        action: "create-auction",
        environment: "production",
        protocol_version: "3.0",
        responses: [],
      }),
    });

    const response = await handleWorldVerifyRequest(request, {
      config,
      fetchImplementation: (async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as {
          protocol_version: string;
          nonce: string;
          action?: string;
          environment?: string;
          responses: unknown[];
        };

        expect(body).toEqual({
          protocol_version: "3.0",
          nonce: "nonce-demo",
          action: "create-auction",
          environment: "production",
          responses: [],
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "create-auction",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }) as WorldFetchImplementation,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      action: "create-auction",
    });
  });

  test("routes World endpoints through the API router", async () => {
    const fetchHandler = createApiRouter({
      config,
      signRequestImplementation: () => ({
        sig: "0x1234" as const,
        nonce: "0x5678" as const,
        createdAt: 1_775_186_400,
        expiresAt: 1_775_186_700,
      }),
    });

    const response = await fetchHandler(
      new Request("https://human.ly/api/worldid/rp-context", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "create-auction",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { rp_context: { signature: string } };
    expect(json.rp_context.signature).toBe("0x1234");
  });

  test("describes the v1 auction endpoint surface", async () => {
    const fetchHandler = createApiRouter({ config });
    const response = await fetchHandler(
      new Request(
        "https://human.ly/api/auctions/base/0x000000000000000000000000000000000000dEaD",
      ),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      chain: { key: string; chainId: number };
      supportedActions: { previewBid: boolean; buildBidTx: boolean };
      paymentMode: string;
    };
    expect(json.chain.key).toBe("base");
    expect(json.chain.chainId).toBe(8453);
    expect(json.supportedActions.previewBid).toBe(true);
    expect(json.supportedActions.buildBidTx).toBe(true);
    expect(json.paymentMode).toBe("cloudflare_x402_when_configured");
  });

  test("builds an auction preview with normalized tx data", async () => {
    const fetchHandler = createApiRouter({
      config,
      simulateAuctionBidImplementation: async () => ({
        attempted: true,
        ok: true,
      }),
    });

    const response = await fetchHandler(
      new Request(
        "https://human.ly/api/auctions/base-sepolia/0x000000000000000000000000000000000000dEaD/preview-bid",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            bidder: "0x000000000000000000000000000000000000bEEF",
            amount: "1000000",
            maxPrice: "123456789",
            prevTickPrice: "0",
            hookData: "0x1234",
          }),
        },
      ),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      normalizedRequest: { bidder: string; amount: string };
      transaction: { to: string; data: string; chain: { chainId: number } };
      simulation: { attempted: boolean; ok: boolean };
    };
    expect(json.normalizedRequest.bidder).toBe(
      "0x000000000000000000000000000000000000bEEF",
    );
    expect(json.normalizedRequest.amount).toBe("1000000");
    expect(json.transaction.to).toBe(
      "0x000000000000000000000000000000000000dEaD",
    );
    expect(json.transaction.data.startsWith("0x")).toBe(true);
    expect(json.transaction.chain.chainId).toBe(84532);
    expect(json.simulation.ok).toBe(true);
  });

  test("builds a direct submitBid transaction request", async () => {
    const fetchHandler = createApiRouter({ config });
    const response = await fetchHandler(
      new Request(
        "https://human.ly/api/auctions/base/0x000000000000000000000000000000000000dEaD/build-bid-tx",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            bidder: "0x000000000000000000000000000000000000bEEF",
            amount: "1000000",
            maxPrice: "123456789",
          }),
        },
      ),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      transaction: { to: string; value: string; data: string };
      normalizedRequest: { prevTickPrice: string; hookData: string };
    };
    expect(json.transaction.to).toBe(
      "0x000000000000000000000000000000000000dEaD",
    );
    expect(json.transaction.value).toBe("0");
    expect(json.transaction.data.startsWith("0x")).toBe(true);
    expect(json.normalizedRequest.prevTickPrice).toBe("0");
    expect(json.normalizedRequest.hookData).toBe("0x");
  });
});
