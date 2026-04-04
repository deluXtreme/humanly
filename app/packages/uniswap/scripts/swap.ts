import { type Address, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import { publicActions } from "viem";
import { swapToUsdcExactOut } from "../swap";

const API_KEY = process.env.UNISWAP_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
if (!API_KEY) throw new Error("Missing UNISWAP_API_KEY");
if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");

const account = privateKeyToAccount(PRIVATE_KEY);
const client = createWalletClient({
  account,
  chain: optimism,
  transport: http(),
}).extend(publicActions);

// Example: swap WETH -> 0.1 USDC on Optimism
const WETH: Address = "0x4200000000000000000000000000000000000006";
const AMOUNT_OUT = parseUnits("0.1", 6); // USDC

try {
  const hash = await swapToUsdcExactOut(client, API_KEY, WETH, AMOUNT_OUT);
  const explorer = client.chain.blockExplorers?.default.url;
  console.log(`Done: ${explorer}/tx/${hash}`);
} catch (err) {
  const e = err as Error & { shortMessage?: string };
  const msg = e.shortMessage ?? e.message ?? String(err);
  console.error("Swap failed:", msg);
  process.exit(1);
}
