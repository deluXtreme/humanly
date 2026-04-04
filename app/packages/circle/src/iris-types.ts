import type { Hash, Hex } from "viem";

export interface CctpFeeData {
  forwardFee: { med: string };
  minimumFee: number;
}

export function computeFees(
  feeData: CctpFeeData,
  transferAmount: bigint,
): {
  forwardFee: bigint;
  protocolFee: bigint;
  maxFee: bigint;
  totalAmount: bigint;
} {
  const forwardFee = BigInt(feeData.forwardFee.med);
  const protocolFee =
    (transferAmount * BigInt(Math.round(feeData.minimumFee * 100))) /
    1_000_000n;
  const maxFee = forwardFee + protocolFee;
  const totalAmount = transferAmount + maxFee;
  return { forwardFee, protocolFee, maxFee, totalAmount };
}

export interface IrisMessageResponse {
  messages: {
    attestation: Hex;
    message: Hex;
    status: string;
    decodedMessage: {
      sourceDomain: string;
      destinationDomain: string;
      destinationCaller: Hex;
    };
    forwardTxHash?: string;
  }[];
}

export interface AttestationData {
  message: Hex;
  attestation: Hex;
  destinationDomain: number;
}

export function irisStatusUrl(
  irisApiBase: string,
  srcDomain: number,
  burnTxHash: Hash,
): string {
  return `${irisApiBase}/v2/messages/${srcDomain}?transactionHash=${burnTxHash}`;
}

export function parseAttestationData(
  data: IrisMessageResponse,
): AttestationData {
  const msg = data.messages?.[0];
  if (!msg) {
    throw new Error("No messages in IRIS response");
  }
  if (msg.status !== "complete") {
    throw new Error(`IRIS message status: ${msg.status}, expected complete`);
  }
  return {
    message: msg.message,
    attestation: msg.attestation,
    destinationDomain: Number(msg.decodedMessage.destinationDomain),
  };
}
