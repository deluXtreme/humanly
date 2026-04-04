import { describe, expect, test } from "bun:test";
import {
  DEPOSIT_FOR_BURN_TOPIC,
  encodeHookData,
  getChainByDomain,
  getIrisApiBase,
  irisStatusUrl,
} from "./index";

describe("circle package exports", () => {
  test("returns known chain metadata by domain", () => {
    expect(getChainByDomain("mainnet", 6)?.name).toBe("Base");
    expect(getChainByDomain("mainnet", 6)?.creChainSelector).toBe(
      "ethereum-mainnet-base-1",
    );
  });

  test("builds IRIS status URLs", () => {
    expect(irisStatusUrl(getIrisApiBase("mainnet"), 6, "0xabc123")).toBe(
      "https://iris-api.circle.com/v2/messages/6?transactionHash=0xabc123",
    );
  });

  test("encodes cctp-forward hook data prefix", () => {
    expect(
      encodeHookData("0x1234").startsWith("0x636374702d666f7277617264"),
    ).toBe(true);
  });

  test("exports the deposit for burn topic", () => {
    expect(DEPOSIT_FOR_BURN_TOPIC).toBe(
      "0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5",
    );
  });
});
