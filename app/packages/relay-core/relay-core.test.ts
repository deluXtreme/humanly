import { describe, expect, test } from "bun:test";
import { decodeFunctionData, hexToBytes, pad, type Hex } from "viem";
import {
  encodeMintAndSubmitBidCalldata,
  MINT_AND_SUBMIT_BID_ABI,
  parseDepositForBurnData,
  shouldRelayDepositForBurn,
} from "./index";

function toBytes(hex: string, size: number): Uint8Array {
  return hexToBytes(pad(hex as Hex, { size }));
}

function buildDepositForBurnData(opts: {
  amount?: bigint;
  mintRecipient?: Hex;
  destinationDomain?: number;
  destinationTokenMessenger?: Hex;
  destinationCaller: Hex;
  maxFee?: bigint;
}): Uint8Array {
  const data = new Uint8Array(6 * 32);

  const amount = `0x${(opts.amount ?? 201838n).toString(16).padStart(64, "0")}` as Hex;
  const mintRecipient =
    opts.mintRecipient ??
    ("0x0000000000000000000000001111111111111111111111111111111111111111" as Hex);
  const destinationDomain = `0x${(opts.destinationDomain ?? 10).toString(16).padStart(64, "0")}` as Hex;
  const destinationTokenMessenger =
    opts.destinationTokenMessenger ??
    ("0x0000000000000000000000002222222222222222222222222222222222222222" as Hex);
  const maxFee = `0x${(opts.maxFee ?? 99n).toString(16).padStart(64, "0")}` as Hex;

  data.set(hexToBytes(amount), 0);
  data.set(toBytes(mintRecipient, 32), 32);
  data.set(hexToBytes(destinationDomain), 64);
  data.set(toBytes(destinationTokenMessenger, 32), 96);
  data.set(toBytes(opts.destinationCaller, 32), 128);
  data.set(hexToBytes(maxFee), 160);

  return data;
}

describe("parseDepositForBurnData", () => {
  test("extracts fixed-width event fields", () => {
    const destinationCaller =
      "0x000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd";

    const parsed = parseDepositForBurnData(
      buildDepositForBurnData({
        amount: 777n,
        destinationDomain: 6,
        destinationCaller: destinationCaller as Hex,
        maxFee: 42n,
      }),
    );

    expect(parsed.amount).toBe(777n);
    expect(parsed.destinationDomain).toBe(6);
    expect(parsed.destinationCaller).toBe(destinationCaller);
    expect(parsed.maxFee).toBe(42n);
  });

  test("throws when event data is too short", () => {
    expect(() => parseDepositForBurnData(new Uint8Array(10))).toThrow(
      "too short",
    );
  });
});

describe("shouldRelayDepositForBurn", () => {
  test("matches destination caller case-insensitively", () => {
    expect(
      shouldRelayDepositForBurn(
        {
          mintRecipient:
            "0x000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd",
        },
        "0x000000000000000000000000ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
      ),
    ).toBe(true);
  });

  test("returns false when caller does not match", () => {
    expect(
      shouldRelayDepositForBurn(
        {
          mintRecipient:
            "0x000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd",
        },
        "0x0000000000000000000000001111111111111111111111111111111111111111",
      ),
    ).toBe(false);
  });
});

describe("encodeMintAndSubmitBidCalldata", () => {
  test("encodes the destination auction call", () => {
    const calldata = encodeMintAndSubmitBidCalldata("0x1234", "0xabcd");
    const decoded = decodeFunctionData({
      abi: MINT_AND_SUBMIT_BID_ABI,
      data: calldata,
    });

    expect(decoded.functionName).toBe("mintAndSubmitBid");
    expect(decoded.args).toEqual(["0x1234", "0xabcd"]);
  });
});
