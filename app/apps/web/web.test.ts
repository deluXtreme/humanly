import { describe, expect, test } from "bun:test";

import { createWebConfig } from "./config.ts";
import { createWebFetchHandler } from "./server.ts";

describe("web app", () => {
  test("creates the web config with sensible local defaults", () => {
    const config = createWebConfig({});

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:3010");
    expect(config.worldAction).toBe("create-auction");
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(3011);
  });

  test("reads web overrides from the environment", () => {
    const config = createWebConfig({
      API_BASE_URL: "http://127.0.0.1:4010",
      WORLD_ACTION: "create-auction",
      HOST: "0.0.0.0",
      PORT: "4011",
    });

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:4010");
    expect(config.worldAction).toBe("create-auction");
    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(4011);
  });

  test("serves the IDKit WASM asset", async () => {
    const fetch = await createWebFetchHandler({
      apiBaseUrl: "http://127.0.0.1:3010",
      worldAction: "create-auction",
      host: "127.0.0.1",
      port: 3011,
    });

    const response = fetch(new Request("http://local/idkit_wasm_bg.wasm"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/wasm");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
});
