import {
  type Address,
  type Hash,
  encodeFunctionData,
  erc20Abi,
  maxUint256,
} from "viem";
import type { ClientWithPublicActions } from "./types";

export async function approveIfNecessary(
  client: ClientWithPublicActions,
  token: Address,
  spender: Address,
  amount: bigint,
): Promise<Hash | null> {
  const allowance = await client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [client.account.address, spender],
  });

  if (allowance >= amount) return null;

  const hash = await client.sendTransaction({
    to: token,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, maxUint256],
    }),
  });

  await client.waitForTransactionReceipt({ hash });
  return hash;
}
