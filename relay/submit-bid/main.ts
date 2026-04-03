import {
  EVMClient,
  type EVMLog,
  HTTPClient,
  consensusIdenticalAggregation,
  handler,
  json,
  logTriggerConfig,
  Runner,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk";
import { bytesToHex, encodeFunctionData, type Hex } from "viem";
import {
  irisStatusUrl,
  parseAttestationData,
  type AttestationData,
  type IrisMessageResponse,
} from "../../app/packages/circle/src/iris-types";
import { getChainByDomain } from "../../app/packages/circle/src/data";

const BASE_CHAIN_SELECTOR =
  EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-mainnet-base-1"];
const TOKEN_MESSENGER_V2 = "0x28b5a0e9c621a5badaa536219b3a228c8168cf5d";
const DEPOSIT_FOR_BURN_TOPIC =
  "0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5";

const IRIS_API_BASE = "https://iris-api.circle.com";
const SRC_DOMAIN = 6; // Base

const MINT_AND_SUBMIT_BID_ABI = [
  {
    type: "function",
    name: "mintAndSubmitBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export type Config = {
  cctpAuctionCaller: string; // bytes32 hex of the destinationCaller to match
  cctpAuctionContract: string; // address of the auction contract on destination chain
};

function fetchAttestation(
  nodeRuntime: NodeRuntime<Config>,
  txHash: string,
): AttestationData {
  const http = new HTTPClient();
  const url = irisStatusUrl(IRIS_API_BASE, SRC_DOMAIN, txHash as Hex);
  const response = http.sendRequest(nodeRuntime, { url, method: "GET" });
  const irisData = json(response.result()) as IrisMessageResponse;
  return parseAttestationData(irisData);
}

export const onDepositForBurn = (runtime: Runtime<Config>, log: EVMLog): string => {
  const txHash = bytesToHex(log.txHash);
  runtime.log(`DepositForBurn detected in tx ${txHash}`);

  // destinationCaller is not indexed, so we filter in the handler.
  // Data layout (each field 32 bytes):
  //   [0]   amount
  //   [1]   mintRecipient
  //   [2]   destinationDomain
  //   [3]   destinationTokenMessenger
  //   [4]   destinationCaller
  //   [5]   maxFee
  //   [6..] hookData (offset + length encoded)
  const callerOffset = 4 * 32;
  const destinationCaller = bytesToHex(log.data.slice(callerOffset, callerOffset + 32));

  const expected = runtime.config.cctpAuctionCaller.toLowerCase();
  if (destinationCaller !== expected) {
    runtime.log(
      `Skipping: destinationCaller ${destinationCaller} !== ${expected}`,
    );
    return "";
  }

  // Fetch attestation from IRIS (runs on each node, consensus on identical result)
  const getAttestation = runtime.runInNodeMode(
    fetchAttestation,
    consensusIdenticalAggregation<AttestationData>(),
  );
  const { message, attestation, destinationDomain } = getAttestation(txHash).result();

  const destChain = getChainByDomain("mainnet", destinationDomain);
  if (!destChain) {
    runtime.log(`Unknown destination domain: ${destinationDomain}`);
    return "";
  }

  runtime.log(
    `Attestation ready for tx ${txHash}, minting on ${destChain.name} (domain ${destinationDomain})`,
  );

  // Encode mintAndSubmitBid calldata
  const calldata = encodeFunctionData({
    abi: MINT_AND_SUBMIT_BID_ABI,
    functionName: "mintAndSubmitBid",
    args: [message, attestation],
  });

  // TODO: Submit transaction to destination chain via EVMClient.writeReport

  return calldata;
};

export const initWorkflow = (config: Config) => {
  const evmClient = new EVMClient(BASE_CHAIN_SELECTOR);

  return [
    handler(
      evmClient.logTrigger(
        logTriggerConfig({
          addresses: [TOKEN_MESSENGER_V2],
          topics: [[DEPOSIT_FOR_BURN_TOPIC]],
        }),
      ),
      onDepositForBurn,
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
