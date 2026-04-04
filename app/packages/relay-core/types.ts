import type { Hex } from "viem";

export type SubmitBidConfig = {
  cctpAuctionCaller: string;
  cctpAuctionContract: string;
};

export type DepositForBurnLikeLog = {
  data: Uint8Array;
};

export interface ParsedDepositForBurn {
  amount: bigint;
  mintRecipient: Hex;
  destinationDomain: number;
  destinationTokenMessenger: Hex;
  destinationCaller: Hex;
  maxFee: bigint;
}
