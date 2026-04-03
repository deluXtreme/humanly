import type { Hash } from "viem";
import type { IrisMessageResponse } from "./iris-types";

export type {
  CctpFeeData,
  IrisMessageResponse,
  AttestationData,
} from "./iris-types";
export {
  computeFees,
  irisStatusUrl,
  parseAttestationData,
} from "./iris-types";

export async function getCctpFees(
  irisApiBase: string,
  srcDomain: number,
  destDomain: number,
): Promise<import("./iris-types").CctpFeeData[]> {
  const res = await fetch(
    `${irisApiBase}/v2/burn/USDC/fees/${srcDomain}/${destDomain}?forward=true`,
  );
  return res.json() as Promise<import("./iris-types").CctpFeeData[]>;
}

export async function getAttestationData(
  irisApiBase: string,
  srcDomain: number,
  burnTxHash: Hash,
  pollIntervalMs = 2000,
): Promise<import("./iris-types").AttestationData> {
  const { irisStatusUrl, parseAttestationData } = await import("./iris-types");
  const url = irisStatusUrl(irisApiBase, srcDomain, burnTxHash);

  while (true) {
    const res = await fetch(url);
    const data = (await res.json()) as IrisMessageResponse;
    const msg = data.messages?.[0];

    if (msg?.status === "complete") {
      return parseAttestationData(data);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

export async function waitForMint(
  irisApiBase: string,
  srcDomain: number,
  burnTxHash: Hash,
  pollIntervalMs = 2000,
): Promise<{ mintTxHash: string; statusUrl: string }> {
  const statusUrl = `${irisApiBase}/v2/messages/${srcDomain}?transactionHash=${burnTxHash}`;

  while (true) {
    const res = await fetch(statusUrl);
    const data = (await res.json()) as {
      messages?: { forwardTxHash?: string }[];
    };

    if (data.messages?.[0]?.forwardTxHash) {
      return { mintTxHash: data.messages[0].forwardTxHash, statusUrl };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}
