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
import { bytesToHex, type Hex } from "viem";
import {
  getChainByDomain,
  getIrisApiBase,
  irisStatusUrl,
  type AttestationData,
  type IrisMessageResponse,
  parseAttestationData,
} from "circle";
import {
  DEPOSIT_FOR_BURN_TOPIC,
  encodeMintAndSubmitBidCalldata,
  parseDepositForBurnLog,
  shouldRelayDepositForBurn,
  TOKEN_MESSENGER_V2,
  type SubmitBidConfig,
} from "relay-core";

const BASE_CHAIN_SELECTOR =
  EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-mainnet-base-1"];
const SRC_DOMAIN = 6; // Base

export type Config = SubmitBidConfig;

function getSrcChain(config: Config): ChainConfig {
  const chain = getChainByDomain(config.network, config.srcDomain);
  if (!chain) throw new Error(`Unknown source domain: ${config.srcDomain}`);
  return chain;
}

function fetchAttestation(
  nodeRuntime: NodeRuntime<Config>,
  txHash: string,
): AttestationData {
  const srcChain = getSrcChain(nodeRuntime.config);
  const irisApiBase = getIrisApiBase(nodeRuntime.config.network);
  const http = new HTTPClient();
  const url = irisStatusUrl(getIrisApiBase("mainnet"), SRC_DOMAIN, txHash as Hex);
  const response = http.sendRequest(nodeRuntime, { url, method: "GET" });
  const irisData = json(response.result()) as IrisMessageResponse;
  return parseAttestationData(irisData);
}

export const onDepositForBurn = (
  runtime: Runtime<Config>,
  log: EVMLog,
): string => {
  const txHash = bytesToHex(log.txHash);
  const deposit = parseDepositForBurnLog(log);
  runtime.log(`DepositForBurn detected in tx ${txHash}`);

  const expected = runtime.config.cctpAuctionCaller.toLowerCase();
  if (!shouldRelayDepositForBurn(deposit, runtime.config.cctpAuctionCaller)) {
    runtime.log(
      `Skipping: destinationCaller ${deposit.destinationCaller} !== ${expected}`,
    );
    return "";
  }

  // Fetch attestation from IRIS (runs on each node, consensus on identical result)
  const getAttestation = runtime.runInNodeMode(
    fetchAttestation,
    consensusIdenticalAggregation<AttestationData>(),
  );
  const { message, attestation, destinationDomain } =
    getAttestation(txHash).result();

  const destChain = getChainByDomain(runtime.config.network, destinationDomain);
  if (!destChain) {
    runtime.log(`Unknown destination domain: ${destinationDomain}`);
    return "";
  }

  runtime.log(
    `Attestation ready for tx ${txHash}, minting on ${destChain.name} (domain ${destinationDomain})`,
  );

  const calldata = encodeMintAndSubmitBidCalldata(message, attestation);

  // TODO: Submit transaction to destination chain via EVMClient.writeReport

  return calldata;
};

export const initWorkflow = (config: Config) => {
  const srcChain = getSrcChain(config);
  const evmClient = new EVMClient(
    EVMClient.SUPPORTED_CHAIN_SELECTORS[
      srcChain.creChainSelector as keyof typeof EVMClient.SUPPORTED_CHAIN_SELECTORS
    ],
  );

  return [
    handler(
      evmClient.logTrigger(
        logTriggerConfig({
          addresses: [srcChain.tokenMessenger],
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
