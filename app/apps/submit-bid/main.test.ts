import { describe, expect } from "bun:test";
import { newTestRuntime, test } from "@chainlink/cre-sdk/test";
import { onDepositForBurn, submitMintAndSubmitBid } from "./workflow";
import type { Config } from "./workflow";
import type { EVMLog } from "@chainlink/cre-sdk";
import { type Hex, hexToBytes, pad } from "viem";
import type { ChainConfig } from "circle";

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
const DEST_CHAIN: ChainConfig = {
  name: "Base Sepolia",
  domain: 6,
  chain: {} as ChainConfig["chain"],
  creChainSelector: "ethereum-testnet-sepolia-base-1",
  usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
};

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

  test("submits a report for matching burns", async () => {
    const config: Config = {
      network: "testnet",
      srcDomain: 10,
      cctpAuctionCaller: AUCTION_CALLER,
      cctpAuctionContract: AUCTION_CONTRACT,
    };

    const calls: {
      estimateGas?: unknown;
      report?: unknown;
      writeReport?: unknown;
      logs: string[];
    } = { logs: [] };

    const runtime = {
      config,
      log(message: string) {
        calls.logs.push(message);
      },
      report(input: unknown) {
        calls.report = input;
        return {
          result: () => ({ mockReport: true }),
        };
      },
    } as const;

    const fakeEvmClient = {
      estimateGas(_runtime: unknown, input: unknown) {
        calls.estimateGas = input;
        return {
          result: () => ({ gas: 100000n }),
        };
      },
      writeReport(_runtime: unknown, input: unknown) {
        calls.writeReport = input;
        return {
          result: () => ({
            txHash: hexToBytes(
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ),
          }),
        };
      },
    };

    submitMintAndSubmitBid(
      runtime as never,
      DEST_CHAIN,
      "0xdeadbeef",
      fakeEvmClient as never,
    );

    expect(calls.estimateGas).toBeTruthy();
    expect(calls.report).toBeTruthy();
    expect(calls.writeReport).toEqual({
      receiver: AUCTION_CONTRACT,
      report: { mockReport: true },
      gasConfig: { gasLimit: "120000" },
    });
    expect(
      calls.logs.some((message) => message.includes("Submitted mintAndSubmitBid")),
    ).toBe(true);
  });
});
