import { describe, expect, test } from "bun:test";
import {
  encodeHookData,
  getChainByDomain,
  getIrisApiBase,
  irisStatusUrl,
} from "./index";

describe("circle package exports", () => {
  test("returns known chain metadata by domain", () => {
    expect(getChainByDomain("mainnet", 6)?.name).toBe("Base");
  });

  test("builds IRIS status URLs", () => {
    expect(irisStatusUrl(getIrisApiBase("mainnet"), 6, "0xabc123")).toBe(
      "https://iris-api.circle.com/v2/messages/6?transactionHash=0xabc123",
    );
  });

  test("encodes cctp-forward hook data prefix", () => {
    expect(encodeHookData("0x1234").startsWith("0x636374702d666f7277617264")).toBe(
      true,
    );
  });
});
