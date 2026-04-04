import { describe, expect, test } from "bun:test";

import { createWebConfig } from "./config.ts";
import { createWebFetchHandler } from "./server.ts";

describe("web app", () => {
  test("creates the web config with sensible local defaults", () => {
    const config = createWebConfig({
      WORLD_RP_ID: "rp_1234567890abcdef",
    });

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:3010");
    expect(config.worldAction).toBe("create-auction");
    expect(config.worldRpId).toBe("rp_1234567890abcdef");
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(3011);
    expect(config.previewAddresses.liquidityLauncher).toBe(
      "0x00000008412db3394C91A5CbD01635c6d140637C",
    );
  });

  test("reads web overrides from the environment", () => {
    const config = createWebConfig({
      API_BASE_URL: "http://127.0.0.1:4010",
      WORLD_ACTION: "create-auction",
      WORLD_RP_ID: "rp_abcdef1234567890",
      HOST: "0.0.0.0",
      PORT: "4011",
      PREVIEW_LIQUIDITY_LAUNCHER_ADDRESS:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      PREVIEW_UERC20_FACTORY_ADDRESS:
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      PREVIEW_FULL_RANGE_LBP_STRATEGY_FACTORY_ADDRESS:
        "0xcccccccccccccccccccccccccccccccccccccccc",
      PREVIEW_CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS:
        "0xdddddddddddddddddddddddddddddddddddddddd",
    });

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:4010");
    expect(config.worldAction).toBe("create-auction");
    expect(config.worldRpId).toBe("rp_abcdef1234567890");
    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(4011);
    expect(config.previewAddresses.uerc20Factory).toBe(
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
  });

  test("serves the IDKit WASM asset", async () => {
    const fetch = await createWebFetchHandler({
      apiBaseUrl: "http://127.0.0.1:3010",
      worldAction: "create-auction",
      worldRpId: "rp_1234567890abcdef",
      host: "127.0.0.1",
      port: 3011,
      previewAddresses: {
        liquidityLauncher: "0x1111111111111111111111111111111111111111",
        uerc20Factory: "0x2222222222222222222222222222222222222222",
        fullRangeLbpStrategyFactory:
          "0x3333333333333333333333333333333333333333",
        continuousClearingAuctionFactory:
          "0x4444444444444444444444444444444444444444",
      },
      humanlyCcaAddress: "0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57",
    });

    const response = fetch(new Request("http://local/idkit_wasm_bg.wasm"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/wasm");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("serves the launch studio page", async () => {
    const fetch = await createWebFetchHandler({
      apiBaseUrl: "http://127.0.0.1:3010",
      worldAction: "create-auction",
      worldRpId: "rp_1234567890abcdef",
      host: "127.0.0.1",
      port: 3011,
      previewAddresses: {
        liquidityLauncher: "0x1111111111111111111111111111111111111111",
        uerc20Factory: "0x2222222222222222222222222222222222222222",
        fullRangeLbpStrategyFactory:
          "0x3333333333333333333333333333333333333333",
        continuousClearingAuctionFactory:
          "0x4444444444444444444444444444444444444444",
      },
      humanlyCcaAddress: "0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57",
    });

    const response = fetch(new Request("http://local/"));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Humanly / Launch Studio");
    expect(html).toContain("Connect wallet");
    expect(html).toContain("Build launch preview");
    expect(html).toContain("Verify with World ID");
    expect(html).toContain("Create auction onchain");
  });
});
