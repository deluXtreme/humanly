import type { Hash } from "viem";

export interface CctpFeeData {
  forwardFee: { med: string };
  minimumFee: number;
}

export async function getCctpFees(
  irisApiBase: string,
  srcDomain: number,
  destDomain: number,
): Promise<CctpFeeData[]> {
  const res = await fetch(
    `${irisApiBase}/v2/burn/USDC/fees/${srcDomain}/${destDomain}?forward=true`,
  );
  return res.json() as Promise<CctpFeeData[]>;
}

export function computeFees(
  feeData: CctpFeeData,
  transferAmount: bigint,
): { forwardFee: bigint; protocolFee: bigint; maxFee: bigint; totalAmount: bigint } {
  const forwardFee = BigInt(feeData.forwardFee.med);
  const protocolFee =
    (transferAmount * BigInt(Math.round(feeData.minimumFee * 100))) / 1_000_000n;
  const maxFee = forwardFee + protocolFee;
  const totalAmount = transferAmount + maxFee;
  return { forwardFee, protocolFee, maxFee, totalAmount };
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
