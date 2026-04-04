import { encodeAbiParameters, keccak256 } from "viem";

import type {
  AbiParameter,
  Hex,
  HumanlyCcaParams,
} from "./types.ts";

export function abiEncode(parameters: readonly AbiParameter[]): Hex {
  return encodeAbiParameters(
    parameters.map((parameter) => ({ type: parameter.type })),
    parameters.map((parameter) => parameter.value),
  ) as Hex;
}

const HUMANLY_CCA_PARAMS_ABI_PARAMETERS = [
  {
    type: "tuple",
    components: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "initialSupply", type: "uint128" },
      { name: "tokenData", type: "bytes" },
    ],
  },
  {
    type: "tuple",
    components: [
      { name: "salt", type: "bytes32" },
      {
        name: "migratorParams",
        type: "tuple",
        components: [
          { name: "poolLPFee", type: "uint24" },
          { name: "poolTickSpacing", type: "int24" },
          { name: "positionRecipient", type: "address" },
          { name: "migrationBlock", type: "uint64" },
          { name: "initializerFactory", type: "address" },
          { name: "tokenSplit", type: "uint24" },
          { name: "sweepBlock", type: "uint64" },
          { name: "operator", type: "address" },
          { name: "maxCurrencyAmountForLP", type: "uint128" },
        ],
      },
      {
        name: "auctionParams",
        type: "tuple",
        components: [
          { name: "tokensRecipient", type: "address" },
          { name: "fundsRecipient", type: "address" },
          { name: "startBlock", type: "uint64" },
          { name: "endBlock", type: "uint64" },
          { name: "claimBlock", type: "uint64" },
          { name: "tickSpacing", type: "uint256" },
          { name: "validationHook", type: "address" },
          { name: "floorPrice", type: "uint256" },
          { name: "requiredCurrencyRaised", type: "uint128" },
          { name: "auctionStepsData", type: "bytes" },
        ],
      },
    ],
  },
] as const;

export const HUMANLY_CCA_ABI = [
  {
    type: "function",
    name: "verifyAndExecute",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "idParams",
        type: "tuple",
        components: [
          { name: "nullifier", type: "uint256" },
          { name: "action", type: "uint256" },
          { name: "rpId", type: "uint64" },
          { name: "nonce", type: "uint256" },
          { name: "signalHash", type: "uint256" },
          { name: "expiresAtMin", type: "uint64" },
          { name: "issuerSchemaId", type: "uint64" },
          { name: "credentialGenesisIssuedAtMin", type: "uint256" },
          { name: "zeroKnowledgeProof", type: "uint256[5]" },
        ],
      },
      {
        name: "ccaParams",
        type: "tuple",
        components: [
          {
            name: "createTokenParams",
            type: "tuple",
            components: [
              { name: "name", type: "string" },
              { name: "symbol", type: "string" },
              { name: "initialSupply", type: "uint128" },
              { name: "tokenData", type: "bytes" },
            ],
          },
          {
            name: "distributeTokenParams",
            type: "tuple",
            components: [
              { name: "salt", type: "bytes32" },
              {
                name: "migratorParams",
                type: "tuple",
                components: [
                  { name: "poolLPFee", type: "uint24" },
                  { name: "poolTickSpacing", type: "int24" },
                  { name: "positionRecipient", type: "address" },
                  { name: "migrationBlock", type: "uint64" },
                  { name: "initializerFactory", type: "address" },
                  { name: "tokenSplit", type: "uint24" },
                  { name: "sweepBlock", type: "uint64" },
                  { name: "operator", type: "address" },
                  { name: "maxCurrencyAmountForLP", type: "uint128" },
                ],
              },
              {
                name: "auctionParams",
                type: "tuple",
                components: [
                  { name: "tokensRecipient", type: "address" },
                  { name: "fundsRecipient", type: "address" },
                  { name: "startBlock", type: "uint64" },
                  { name: "endBlock", type: "uint64" },
                  { name: "claimBlock", type: "uint64" },
                  { name: "tickSpacing", type: "uint256" },
                  { name: "validationHook", type: "address" },
                  { name: "floorPrice", type: "uint256" },
                  { name: "requiredCurrencyRaised", type: "uint128" },
                  { name: "auctionStepsData", type: "bytes" },
                ],
              },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
] as const;

export function encodeHumanlyCcaParams(params: HumanlyCcaParams): Hex {
  return encodeAbiParameters(HUMANLY_CCA_PARAMS_ABI_PARAMETERS, [
    {
      name: params.createTokenParams.name,
      symbol: params.createTokenParams.symbol,
      initialSupply: params.createTokenParams.initialSupply,
      tokenData: params.createTokenParams.tokenData,
    },
    {
      salt: params.distributeTokenParams.salt,
      migratorParams: {
        poolLPFee: params.distributeTokenParams.migratorParams.poolLPFee,
        poolTickSpacing: params.distributeTokenParams.migratorParams.poolTickSpacing,
        positionRecipient: params.distributeTokenParams.migratorParams.positionRecipient,
        migrationBlock: params.distributeTokenParams.migratorParams.migrationBlock,
        initializerFactory:
          params.distributeTokenParams.migratorParams.initializerFactory,
        tokenSplit: params.distributeTokenParams.migratorParams.tokenSplit,
        sweepBlock: params.distributeTokenParams.migratorParams.sweepBlock,
        operator: params.distributeTokenParams.migratorParams.operator,
        maxCurrencyAmountForLP:
          params.distributeTokenParams.migratorParams.maxCurrencyAmountForLP,
      },
      auctionParams: {
        tokensRecipient: params.distributeTokenParams.auctionParams.tokensRecipient,
        fundsRecipient: params.distributeTokenParams.auctionParams.fundsRecipient,
        startBlock: params.distributeTokenParams.auctionParams.startBlock,
        endBlock: params.distributeTokenParams.auctionParams.endBlock,
        claimBlock: params.distributeTokenParams.auctionParams.claimBlock,
        tickSpacing: params.distributeTokenParams.auctionParams.tickSpacing,
        validationHook: params.distributeTokenParams.auctionParams.validationHook,
        floorPrice: params.distributeTokenParams.auctionParams.floorPrice,
        requiredCurrencyRaised:
          params.distributeTokenParams.auctionParams.requiredCurrencyRaised,
        auctionStepsData:
          params.distributeTokenParams.auctionParams.auctionStepsData,
      },
    },
  ]) as Hex;
}

export function hashHumanlyCcaParams(params: HumanlyCcaParams): Hex {
  return keccak256(encodeHumanlyCcaParams(params));
}
