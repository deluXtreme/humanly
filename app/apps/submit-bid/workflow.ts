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
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk";
import { bytesToHex, type Hex } from "viem";
import {
  DEPOSIT_FOR_BURN_TOPIC,
  type ChainConfig,
  getChainByDomain,
  getIrisApiBase,
  irisStatusUrl,
  type AttestationData,
  type IrisMessageResponse,
  parseAttestationData,
} from "circle";
import {
  encodeMintAndSubmitBidCalldata,
  parseDepositForBurnLog,
  shouldRelayDepositForBurn,
  type SubmitBidConfig,
} from "relay-core";

export type Config = SubmitBidConfig;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

function getSrcChain(config: Config): ChainConfig {
  const srcChain = getChainByDomain(config.network, config.srcDomain);
  if (!srcChain) {
    throw new Error(`Unknown source domain: ${config.srcDomain}`);
  }
  return srcChain;
}

function fetchAttestation(
  nodeRuntime: NodeRuntime<Config>,
  txHash: string,
): AttestationData {
  const srcChain = getSrcChain(nodeRuntime.config);
  const http = new HTTPClient();
  const url = irisStatusUrl(
    getIrisApiBase(nodeRuntime.config.network),
    srcChain.domain,
    txHash as Hex,
  );
  const response = http.sendRequest(nodeRuntime, { url, method: "GET" });
  const irisData = json(response.result()) as IrisMessageResponse;
  return parseAttestationData(irisData);
}

function getEvmClient(chainSelector: ChainConfig["creChainSelector"]): EVMClient {
  const chainSelectorKey =
    chainSelector as keyof typeof EVMClient.SUPPORTED_CHAIN_SELECTORS;
  return new EVMClient(EVMClient.SUPPORTED_CHAIN_SELECTORS[chainSelectorKey]);
}

type ReportCapableEvmClient = Pick<EVMClient, "estimateGas" | "writeReport">;

export function submitMintAndSubmitBid(
  runtime: Runtime<Config>,
  destChain: ChainConfig,
  calldata: Hex,
  destEvmClient: ReportCapableEvmClient = getEvmClient(destChain.creChainSelector),
): void {
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
}

export function onDepositForBurn(
  runtime: Runtime<Config>,
  log: EVMLog,
): string {
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
  submitMintAndSubmitBid(runtime, destChain, calldata);

  return calldata;
}

export function initWorkflow(config: Config) {
  const srcChain = getSrcChain(config);
  const evmClient = getEvmClient(srcChain.creChainSelector);

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
}
