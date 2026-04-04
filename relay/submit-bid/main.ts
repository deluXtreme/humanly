import {
  EVMClient,
  type EVMLog,
  HTTPClient,
  consensusIdenticalAggregation,
  encodeCallMsg,
  handler,
  json,
  logTriggerConfig,
  prepareReportRequest,
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
import {
  DEPOSIT_FOR_BURN_TOPIC,
  getChainByDomain,
  getIrisApiBase,
  type ChainConfig,
  type Network,
} from "../../app/packages/circle/src/data";

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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export type Config = {
  network: Network;
  srcDomain: number;
  cctpAuctionCaller: string; // bytes32 hex of the destinationCaller to match
  cctpAuctionContract: string; // address of the auction contract on destination chain
};

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
  const url = irisStatusUrl(irisApiBase, srcChain.domain, txHash as Hex);
  const response = http.sendRequest(nodeRuntime, { url, method: "GET" });
  const irisData = json(response.result()) as IrisMessageResponse;
  return parseAttestationData(irisData);
}

export const onDepositForBurn = (
  runtime: Runtime<Config>,
  log: EVMLog,
): string => {
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
  const destinationCaller = bytesToHex(
    log.data.slice(callerOffset, callerOffset + 32),
  );

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

  // Encode mintAndSubmitBid calldata
  const calldata = encodeFunctionData({
    abi: MINT_AND_SUBMIT_BID_ABI,
    functionName: "mintAndSubmitBid",
    args: [message, attestation],
  });
  const destEvmClient = new EVMClient(
    EVMClient.SUPPORTED_CHAIN_SELECTORS[
      destChain.creChainSelector as keyof typeof EVMClient.SUPPORTED_CHAIN_SELECTORS
    ],
  );
  const gasEstimate = destEvmClient
    .estimateGas(runtime, {
      msg: encodeCallMsg({
        from: ZERO_ADDRESS,
        to: runtime.config.cctpAuctionContract as Hex,
        data: calldata,
      }),
    })
    .result().gas;
  const report = runtime.report(prepareReportRequest(calldata)).result();
  const tx = destEvmClient
    .writeReport(runtime, {
      receiver: runtime.config.cctpAuctionContract,
      report,
      gasConfig: {
        gasLimit: (gasEstimate + gasEstimate / 5n).toString(),
      },
    })
    .result();

  runtime.log(
    `Submitted mintAndSubmitBid on ${destChain.name}: ${tx.txHash ? bytesToHex(tx.txHash) : "tx hash unavailable"}`,
  );

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
