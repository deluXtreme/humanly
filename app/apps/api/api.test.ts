import { describe, expect, test } from "bun:test";
import type { WorldFetchImplementation } from "world";

import {
  createApiRouter,
  createApiWorldConfig,
  handleWorldRpContextRequest,
  handleWorldVerifyRequest,
} from "./index.ts";

describe("api app", () => {
  test("creates API world config from environment variables", () => {
    const config = createApiWorldConfig({
      WORLD_APP_ID: "app_demo",
      WORLD_RP_ID: "rp_demo",
      WORLD_RP_SIGNING_KEY:
        "0x3333333333333333333333333333333333333333333333333333333333333333",
      WORLD_ALLOWED_ACTIONS: "create-auction,place-bid",
      WORLD_RP_TTL_SECONDS: "600",
    });

    expect(config.appId).toBe("app_demo");
    expect(config.rpId).toBe("rp_demo");
    expect(config.allowedActions).toEqual(["create-auction", "place-bid"]);
    expect(config.rpContextTtlSeconds).toBe(600);
  });

  test("builds a full IDKit request from the RP context handler", async () => {
    const config = createApiWorldConfig({
      WORLD_APP_ID: "app_demo",
      WORLD_RP_ID: "rp_demo",
      WORLD_RP_SIGNING_KEY:
        "0x4444444444444444444444444444444444444444444444444444444444444444",
      WORLD_ALLOWED_ACTIONS: "create-auction",
    });

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
    const config = createApiWorldConfig({
      WORLD_APP_ID: "app_demo",
      WORLD_RP_ID: "rp_demo",
      WORLD_RP_SIGNING_KEY:
        "0x5555555555555555555555555555555555555555555555555555555555555555",
      WORLD_ALLOWED_ACTIONS: "create-auction",
    });

    const request = new Request("https://human.ly/api/worldid/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nonce: "0xabcd",
        action: "create-auction",
        responses: [],
      }),
    });

    const response = await handleWorldVerifyRequest(request, {
      config,
      fetchImplementation: (async () =>
        new Response(
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
        )) as WorldFetchImplementation,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      action: "create-auction",
    });
  });

  test("routes World endpoints through the API router", async () => {
    const config = createApiWorldConfig({
      WORLD_APP_ID: "app_demo",
      WORLD_RP_ID: "rp_demo",
      WORLD_RP_SIGNING_KEY:
        "0x6666666666666666666666666666666666666666666666666666666666666666",
      WORLD_ALLOWED_ACTIONS: "create-auction",
    });

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
});
