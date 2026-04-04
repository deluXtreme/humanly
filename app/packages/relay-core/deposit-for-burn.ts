import { bytesToHex, type Hex } from "viem";
import type { DepositForBurnLikeLog, ParsedDepositForBurn } from "./types";

const WORD_SIZE = 32;
const REQUIRED_DATA_LENGTH = 6 * WORD_SIZE;

function readWord(data: Uint8Array, wordIndex: number): Uint8Array {
  const start = wordIndex * WORD_SIZE;
  const end = start + WORD_SIZE;
  return data.slice(start, end);
}

function readHexWord(data: Uint8Array, wordIndex: number): Hex {
  return bytesToHex(readWord(data, wordIndex)) as Hex;
}

function readUintWord(data: Uint8Array, wordIndex: number): bigint {
  return BigInt(readHexWord(data, wordIndex));
}

export function parseDepositForBurnData(data: Uint8Array): ParsedDepositForBurn {
  if (data.length < REQUIRED_DATA_LENGTH) {
    throw new Error(
      `DepositForBurn data too short: expected at least ${REQUIRED_DATA_LENGTH} bytes, received ${data.length}`,
    );
  }

  return {
    amount: readUintWord(data, 0),
    mintRecipient: readHexWord(data, 1),
    destinationDomain: Number(readUintWord(data, 2)),
    destinationTokenMessenger: readHexWord(data, 3),
    destinationCaller: readHexWord(data, 4),
    maxFee: readUintWord(data, 5),
  };
}

export function parseDepositForBurnLog(
  log: DepositForBurnLikeLog,
): ParsedDepositForBurn {
  return parseDepositForBurnData(log.data);
}
