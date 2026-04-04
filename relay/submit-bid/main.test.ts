import { describe, expect } from "bun:test";
import { newTestRuntime, test } from "@chainlink/cre-sdk/test";
import { onDepositForBurn } from "./main";
import type { Config } from "./main";
import type { EVMLog } from "@chainlink/cre-sdk";
import { type Hex, hexToBytes, pad } from "viem";
import {
  parseAttestationData,
  irisStatusUrl,
} from "../../app/packages/circle/src/iris-types";

function toBytes(hex: string, size: number): Uint8Array {
  return hexToBytes(pad(hex as Hex, { size }));
}

function buildDepositForBurnLog(opts: {
  txHash: Hex;
  destinationCaller: Hex;
  amount?: bigint;
}): EVMLog {
  // Data layout (each 32 bytes):
  //   [0] amount  [1] mintRecipient  [2] destinationDomain
  //   [3] destinationTokenMessenger  [4] destinationCaller  [5] maxFee
  const data = new Uint8Array(6 * 32);
  const amountHex =
    `0x${(opts.amount ?? 201838n).toString(16).padStart(64, "0")}` as Hex;
  data.set(hexToBytes(amountHex), 0);
  data.set(toBytes(opts.destinationCaller, 32), 4 * 32);

  return {
    address: hexToBytes("0x28b5a0e9c621a5badaa536219b3a228c8168cf5d"),
    topics: [
      hexToBytes(
        "0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5",
      ),
    ],
    txHash: toBytes(opts.txHash, 32),
    blockHash: new Uint8Array(32),
    data,
    eventSig: hexToBytes(
      "0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5",
    ),
    blockNumber: BigInt(12345),
    txIndex: 0,
    index: 0,
    removed: false,
  } as EVMLog;
}

const AUCTION_CALLER =
  "0x000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd";
const AUCTION_CONTRACT = "0x1234567890abcdef1234567890abcdef12345678";

describe("onDepositForBurn filter", () => {
  test("returns empty string when destinationCaller does not match", async () => {
    const config: Config = {
      network: "mainnet",
      srcDomain: 6,
      cctpAuctionCaller: AUCTION_CALLER,
      cctpAuctionContract: AUCTION_CONTRACT,
    };
    const runtime = newTestRuntime();
    runtime.config = config;

    const otherCaller =
      "0x0000000000000000000000001111111111111111111111111111111111111111";
    const log = buildDepositForBurnLog({
      txHash:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      destinationCaller: otherCaller,
    });

    const result = onDepositForBurn(runtime, log);
    expect(result).toBe("");
  });

  test("logs skip message for non-matching caller", async () => {
    const config: Config = {
      network: "mainnet",
      srcDomain: 6,
      cctpAuctionCaller: AUCTION_CALLER,
      cctpAuctionContract: AUCTION_CONTRACT,
    };
    const runtime = newTestRuntime();
    runtime.config = config;

    const log = buildDepositForBurnLog({
      txHash:
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      destinationCaller: ("0x" + "00".repeat(32)) as Hex,
    });

    onDepositForBurn(runtime, log);
    const logs = runtime.getLogs();
    expect(logs.some((l: string) => l.includes("Skipping"))).toBe(true);
  });
});

describe("irisStatusUrl", () => {
  test("builds correct URL", async () => {
    const url = irisStatusUrl("https://iris-api.circle.com", 6, "0xabc123");
    expect(url).toBe(
      "https://iris-api.circle.com/v2/messages/6?transactionHash=0xabc123",
    );
  });
});

describe("parseAttestationData", () => {
  test("extracts message, attestation, and destinationDomain", async () => {
    const irisResponse = {
      messages: [
        {
          attestation: "0xabcd" as Hex,
          message: "0x1234" as Hex,
          status: "complete",
          decodedMessage: {
            sourceDomain: "6",
            destinationDomain: "10",
            destinationCaller:
              "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
          },
        },
      ],
    };

    const result = parseAttestationData(irisResponse);
    expect(result.message).toBe("0x1234");
    expect(result.attestation).toBe("0xabcd");
    expect(result.destinationDomain).toBe(10);
  });

  test("throws when status is not complete", async () => {
    const irisResponse = {
      messages: [
        {
          attestation: "0x" as Hex,
          message: "0x" as Hex,
          status: "pending",
          decodedMessage: {
            sourceDomain: "6",
            destinationDomain: "10",
            destinationCaller: "0x00" as Hex,
          },
        },
      ],
    };

    expect(() => parseAttestationData(irisResponse)).toThrow("pending");
  });

  test("throws when no messages", async () => {
    expect(() => parseAttestationData({ messages: [] })).toThrow("No messages");
  });
});
