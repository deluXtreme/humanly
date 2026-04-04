import { describe, expect, test } from "bun:test";

import { createCloudflareFetchHandler } from "./src/index.ts";
import type { HumanlyCloudflareEnv } from "./src/types.ts";

function createTestEnv(): HumanlyCloudflareEnv {
  return {
    WORLD_APP_ID: "app_demo",
    WORLD_RP_ID: "rp_demo",
    WORLD_RP_SIGNING_KEY:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    WORLD_ALLOWED_ACTIONS: "create-auction",
    WORLD_ACTION: "create-auction",
    API_BASE_URL: "",
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
});
