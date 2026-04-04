import type {
  Account,
  Address,
  Chain,
  Hex,
  PublicActions,
  Transport,
  WalletClient,
} from "viem";
import { isAddress, isHex } from "viem";

const API_URL = "https://trade-api.gateway.uniswap.org/v1";
const CHAIN_ID = 10; // Optimism
const USDC: Address = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

interface SwapTx {
  to: string;
  from: string;
  data: string;
  value: string;
  gasLimit: string;
}

interface ClassicQuote {
  input: { amount: string };
  output: { amount: string };
  gasFeeUSD: string;
}

interface UniswapXQuote {
  orderInfo: {
    input: { startAmount: string };
    outputs: { startAmount: string; endAmount: string }[];
  };
}

interface PermitData {
  domain: Record<string, unknown>;
  types: Record<string, unknown[]>;
  values: Record<string, unknown>;
}

type QuoteResponse = Record<string, unknown> & {
  routing: string;
  quote: ClassicQuote | UniswapXQuote;
  permitData: PermitData | null;
};

type SwapClient = WalletClient<Transport, Chain, Account> &
  Pick<PublicActions, "waitForTransactionReceipt">;

function apiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "x-universal-router-version": "2.0",
  };
}

function validateSwapTx(swap: SwapTx): void {
  if (!swap.data || swap.data === "" || swap.data === "0x") {
    throw new Error("swap.data is empty - quote may have expired");
  }
  if (!isHex(swap.data as `0x${string}`)) {
    throw new Error("swap.data is not valid hex");
  }
  if (!isAddress(swap.to) || !isAddress(swap.from)) {
    throw new Error("Invalid address in swap response");
  }
}

function isUniswapXRouting(routing: string): boolean {
  return (
    routing === "DUTCH_V2" || routing === "DUTCH_V3" || routing === "PRIORITY"
  );
}

function getInputAmount(quoteResponse: QuoteResponse): string {
  if (isUniswapXRouting(quoteResponse.routing)) {
    return (quoteResponse.quote as UniswapXQuote).orderInfo.input.startAmount;
  }
  return (quoteResponse.quote as ClassicQuote).input.amount;
}

async function signPermitData(
  client: SwapClient,
  permitData: PermitData,
): Promise<Hex> {
  // permitData has { domain, types, values } — EIP-712 typed data
  // Remove EIP712Domain from types if present (viem adds it automatically)
  const { EIP712Domain: _, ...types } = permitData.types as Record<
    string,
    unknown[]
  > & { EIP712Domain?: unknown[] };

  return client.signTypedData({
    domain: permitData.domain as Record<string, unknown>,
    types,
    primaryType: Object.keys(types)[0]!,
    message: permitData.values as Record<string, unknown>,
  });
}

function prepareSwapRequest(
  quoteResponse: QuoteResponse,
  signature?: string,
): Record<string, unknown> {
  const { permitData, permitTransaction, ...cleanQuote } = quoteResponse;
  const request: Record<string, unknown> = { ...cleanQuote };

  if (isUniswapXRouting(quoteResponse.routing)) {
    // UniswapX: signature only, no permitData in /swap body
    if (signature) request.signature = signature;
  } else {
    // CLASSIC: both signature + permitData, or neither
    if (signature && permitData && typeof permitData === "object") {
      request.signature = signature;
      request.permitData = permitData;
    }
  }

  return request;
}

/**
 * Swap any token to USDC on Optimism using EXACT_OUTPUT.
 * Returns the confirmed transaction hash.
 */
export async function swapToUsdcExactOut(
  client: SwapClient,
  apiKey: string,
  tokenIn: Address,
  /** Raw USDC amount (6 decimals), e.g. 1000000n for 1 USDC */
  exactOutAmount: bigint,
): Promise<`0x${string}`> {
  const headers = apiHeaders(apiKey);
  const swapper = client.account.address;

  // 1. Quote
  const quoteRes = await fetch(`${API_URL}/quote`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      swapper,
      tokenIn,
      tokenOut: USDC,
      tokenInChainId: String(CHAIN_ID),
      tokenOutChainId: String(CHAIN_ID),
      amount: exactOutAmount.toString(),
      type: "EXACT_OUTPUT",
      slippageTolerance: 0.5,
      routingPreference: "BEST_PRICE",
    }),
  });
  const quoteResponse = (await quoteRes.json()) as QuoteResponse;
  if (!quoteRes.ok) {
    throw new Error(
      `Quote failed (${quoteRes.status}): ${JSON.stringify(quoteResponse)}`,
    );
  }

  const routing = quoteResponse.routing;
  const inputAmount = getInputAmount(quoteResponse);
  console.log(
    `Quote: ${routing} | input: ${inputAmount} wei | output: ${exactOutAmount} USDC raw`,
  );

  // 2. Check & submit approval for tokenIn
  const approvalRes = await fetch(`${API_URL}/check_approval`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      walletAddress: swapper,
      token: tokenIn,
      amount: inputAmount,
      chainId: CHAIN_ID,
    }),
  });
  const approvalData = (await approvalRes.json()) as {
    approval: { to: Address; data: Hex; value: string } | null;
  };
  if (!approvalRes.ok) {
    throw new Error(`Approval check failed: ${JSON.stringify(approvalData)}`);
  }

  if (approvalData.approval) {
    console.log("Submitting approval tx...");
    const hash = await client.sendTransaction({
      to: approvalData.approval.to,
      data: approvalData.approval.data,
      value: BigInt(approvalData.approval.value || "0"),
    });
    await client.waitForTransactionReceipt({ hash });
    console.log(`Approval confirmed: ${hash}`);
  }

  // 3. Sign Permit2 data if present
  let signature: string | undefined;
  if (quoteResponse.permitData) {
    console.log("Signing Permit2 data...");
    signature = await signPermitData(client, quoteResponse.permitData);
  }

  // 4. Swap
  const swapRequest = prepareSwapRequest(quoteResponse, signature);
  const swapRes = await fetch(`${API_URL}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify(swapRequest),
  });
  const swapData = (await swapRes.json()) as { swap: SwapTx };
  if (!swapRes.ok) {
    throw new Error(
      `Swap failed (${swapRes.status}): ${JSON.stringify(swapData)}`,
    );
  }

  validateSwapTx(swapData.swap);

  console.log("Sending swap tx...");
  const hash = await client.sendTransaction({
    to: swapData.swap.to as Address,
    data: swapData.swap.data as `0x${string}`,
    value: BigInt(swapData.swap.value || "0"),
  });
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log(
    `Swap confirmed in block ${receipt.blockNumber} (${receipt.status})`,
  );

  return hash;
}
