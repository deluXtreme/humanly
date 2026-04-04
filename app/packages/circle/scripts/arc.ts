import {
  createWalletClient,
  http,
  concat,
  encodeFunctionData,
  parseAbi,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChainByDomain, getIrisApiBase, type Network } from "../src/data";
import { approveIfNecessary } from "../src/erc20";
import { depositForBurnWithHook, encodeHookData } from "../src/cctp";
import { getCctpFees, computeFees, waitForMint } from "../src/iris";

// Validate environment variables
const requiredEnvVars = [
  "PRIVATE_KEY",
  "DESTINATION_ADDRESS",
  "SRC_DOMAIN",
  "DEST_DOMAIN",
] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

// Configuration from environment
const NETWORK = (process.env.NETWORK || "testnet") as Network;
const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS as `0x${string}`;
const srcChain = getChainByDomain(NETWORK, Number(process.env.SRC_DOMAIN));
const destChain = getChainByDomain(NETWORK, Number(process.env.DEST_DOMAIN));
const irisApiBase = getIrisApiBase(NETWORK);

// Encode developer hook: unwrap WETH on destination
const WETH = "0x4200000000000000000000000000000000000006" as const;
const hookData = encodeHookData(
  concat([
    WETH,
    encodeFunctionData({
      abi: parseAbi(["function withdraw(uint wad)"]),
      functionName: "withdraw",
      args: [1n],
    }),
  ]),
);

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

async function main() {
  if (!srcChain || !destChain) {
    throw new Error(
      "Invalid SRC_DOMAIN or DEST_DOMAIN — chain not found in config",
    );
  }

  const client = createWalletClient({
    chain: srcChain.chain,
    transport: http(),
    account,
  }).extend(publicActions);

  console.log("Wallet address:", account.address);
  console.log("Destination address:", DESTINATION_ADDRESS);
  console.log("Source Chain:", srcChain.name);
  console.log("Dest Chain:", destChain.name);

  // Step 1: Get fees
  console.log("\nStep 1: Getting CCTP fees...");
  const fees = await getCctpFees(
    irisApiBase,
    srcChain.domain,
    destChain.domain,
  );
  const transferAmount = 1n; // 1 WEI USDC
  const feeData = fees[0];
  if (!feeData) throw new Error("No fee data returned from Iris API");
  const { forwardFee, protocolFee, maxFee, totalAmount } = computeFees(
    feeData,
    transferAmount,
  );

  console.log("Transfer amount:", Number(transferAmount) / 1_000_000, "USDC");
  console.log("Forward fee:", Number(forwardFee) / 1_000_000, "USDC");
  console.log("Protocol fee:", Number(protocolFee) / 1_000_000, "USDC");
  console.log("Max fee:", Number(maxFee) / 1_000_000, "USDC");
  console.log("Total to burn:", Number(totalAmount) / 1_000_000, "USDC");

  // Step 2: Check balance
  const balance = await client.getBalance({ address: account.address });
  console.log("\nETH balance:", Number(balance) / 1e18, "ETH");

  // Step 3: Approve USDC
  console.log("\nStep 3: Approving USDC if necessary...");
  const approveTx = await approveIfNecessary(
    client,
    srcChain.usdc,
    srcChain.tokenMessenger,
    totalAmount,
  );
  if (approveTx) {
    console.log(
      "Approval Tx:",
      `${srcChain.chain.blockExplorers?.default.url}/tx/${approveTx}`,
    );
  } else {
    console.log("Already approved.");
  }

  // Step 4: Burn USDC with Forwarding Service hook
  console.log("\nStep 4: Burning USDC with Forwarding Service hook...");
  const burnTx = await depositForBurnWithHook(client, {
    tokenMessenger: srcChain.tokenMessenger,
    amount: totalAmount,
    destinationDomain: destChain.domain,
    mintRecipient: DESTINATION_ADDRESS,
    burnToken: srcChain.usdc,
    maxFee,
    hookData,
  });
  console.log(
    "Burn Tx:",
    `${srcChain.chain.blockExplorers?.default.url}/tx/${burnTx}`,
  );
  console.log(
    `\nTransfer initiated. Forwarding Service will mint USDC on ${destChain.name}.`,
  );

  // Step 5: Wait for mint
  console.log("\nStep 5: Waiting for mint...");
  const { mintTxHash, statusUrl } = await waitForMint(
    irisApiBase,
    srcChain.domain,
    burnTx,
  );
  console.log("Status URL:", statusUrl);
  console.log(
    "Mint Tx:",
    `${destChain.chain.blockExplorers?.default.url}/tx/${mintTxHash}`,
  );
}

main().catch((err) => {
  const msg = err?.shortMessage || err?.message || String(err);
  const details = err?.details ? `\n  Details: ${err.details}` : "";
  console.error(`Error: ${msg}${details}`);
  process.exit(1);
});
