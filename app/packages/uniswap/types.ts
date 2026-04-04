import type {
  HUMANLY_ALLOWED_POOL_LP_FEES,
  HUMANLY_ALLOWED_POOL_TICK_SPACINGS,
  HUMANLY_AUCTION_SCHEDULE_MODE,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
  HUMANLY_SUPPORTED_LAUNCH_CURRENCY,
  HUMANLY_SUPPORTED_LAUNCH_STRATEGY,
  HUMANLY_SUPPORTED_TOKEN_FACTORY,
} from "./constants.ts";

export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type DecimalString = string;
export type AbiScalarType =
  | "address"
  | "uint8"
  | "uint24"
  | "uint64"
  | "uint128"
  | "uint256"
  | "bytes"
  | "string";

export interface AbiParameter {
  type: AbiScalarType;
  value: Address | bigint | number | Hex | string;
}

export type HumanlyLaunchStrategy =
  typeof HUMANLY_SUPPORTED_LAUNCH_STRATEGY;
export type HumanlyLaunchCurrency =
  typeof HUMANLY_SUPPORTED_LAUNCH_CURRENCY;
export type HumanlyTokenFactory = typeof HUMANLY_SUPPORTED_TOKEN_FACTORY;
export type HumanlyAuctionScheduleMode =
  typeof HUMANLY_AUCTION_SCHEDULE_MODE;
export type HumanlyLaunchNetwork =
  keyof typeof HUMANLY_SUPPORTED_LAUNCH_NETWORKS;

export type HumanlyPoolLpFee = (typeof HUMANLY_ALLOWED_POOL_LP_FEES)[number];
export type HumanlyPoolTickSpacing =
  (typeof HUMANLY_ALLOWED_POOL_TICK_SPACINGS)[number];

export interface HumanlyTokenLaunchInput {
  name: string;
  symbol: string;
  description: string;
  website?: string;
  image?: string;
  initialSupply: DecimalString;
}

export interface HumanlyAuctionLaunchInput {
  startDelayBlocks: number;
  prebidBlocks: number;
  auctionBlocks: number;
  migrationDelayBlocks: number;
  sweepDelayBlocks: number;
  floorPriceUsdc: DecimalString;
  tickSizeUsdc: DecimalString;
  requiredUsdcRaised: DecimalString;
}

export interface HumanlyLiquidityLaunchInput {
  auctionTokenPercentage: number;
  poolLpFee: HumanlyPoolLpFee;
  poolTickSpacing: HumanlyPoolTickSpacing;
  maxUsdcForLp?: DecimalString;
}

export interface HumanlyFullRangeLaunchInput {
  network: HumanlyLaunchNetwork;
  strategy: HumanlyLaunchStrategy;
  currency: HumanlyLaunchCurrency;
  tokenFactory: HumanlyTokenFactory;
  scheduleMode: HumanlyAuctionScheduleMode;
  token: HumanlyTokenLaunchInput;
  auction: HumanlyAuctionLaunchInput;
  liquidity: HumanlyLiquidityLaunchInput;
}

export interface HumanlyLaunchValidationIssue {
  field:
    | "network"
    | "token.name"
    | "token.symbol"
    | "token.description"
    | "token.website"
    | "token.image"
    | "token.initialSupply"
    | "auction.startDelayBlocks"
    | "auction.prebidBlocks"
    | "auction.auctionBlocks"
    | "auction.migrationDelayBlocks"
    | "auction.sweepDelayBlocks"
    | "auction.floorPriceUsdc"
    | "auction.tickSizeUsdc"
    | "auction.requiredUsdcRaised"
    | "liquidity.auctionTokenPercentage"
    | "liquidity.poolLpFee"
    | "liquidity.poolTickSpacing"
    | "liquidity.maxUsdcForLp";
  message: string;
}

export interface HumanlySupplyScheduleEntry {
  mps: number;
  blockDelta: number;
}

export interface HumanlyGeneratedSupplyScheduleSummary {
  totalMps: number;
  targetMps: number;
  finalBlockMps: number;
  finalBlockPercentage: number;
  numSteps: number;
  alpha: number;
  mainSupplyPct: number;
  stepTokensPct: number;
}

export interface HumanlyGeneratedSupplySchedule {
  schedule: HumanlySupplyScheduleEntry[];
  auctionBlocks: number;
  prebidBlocks: number;
  totalPhases: number;
  summary: HumanlyGeneratedSupplyScheduleSummary;
}

export interface HumanlyGenerateSupplyScheduleInput {
  auctionBlocks: number;
  prebidBlocks?: number;
  numSteps?: number;
  alpha?: number;
  mainSupplyPct?: number;
}

export interface HumanlyUerc20Metadata {
  description: string;
  website: string;
  image: string;
}

export interface HumanlyUniswapLaunchAddressBook {
  liquidityLauncher: Address;
  uerc20Factory: Address;
  fullRangeLbpStrategyFactory: Address;
  continuousClearingAuctionFactory: Address;
}

export interface HumanlyBuildLaunchContext {
  creator: Address;
  currentBlock: number | bigint;
  addresses: HumanlyUniswapLaunchAddressBook;
}

export interface HumanlyDerivedPriceConfiguration {
  currencyDecimals: number;
  tokenDecimals: number;
  rawFloorPriceQ96: bigint;
  floorPriceQ96: bigint;
  rawTickSpacingQ96: bigint;
  tickSpacingQ96: bigint;
  requiredCurrencyRaised: bigint;
}

export interface HumanlyDerivedBlockConfiguration {
  startBlock: bigint;
  endBlock: bigint;
  claimBlock: bigint;
  migrationBlock: bigint;
  sweepBlock: bigint;
}

export interface HumanlyLiquidityLauncherCreateTokenArgs {
  factory: Address;
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: bigint;
  recipient: Address;
  tokenData: Hex;
}

export interface HumanlyUniswapDistribution {
  strategy: Address;
  amount: bigint;
  configData: Hex;
}

export interface HumanlyUniswapMigratorParameters {
  migrationBlock: bigint;
  currency: Address;
  poolLPFee: number;
  poolTickSpacing: number;
  tokenSplit: bigint;
  initializerFactory: Address;
  positionRecipient: Address;
  sweepBlock: bigint;
  operator: Address;
  maxCurrencyAmountForLP: bigint;
}

export interface HumanlyUniswapAuctionParameters {
  currency: Address;
  tokensRecipient: Address;
  fundsRecipient: Address;
  startBlock: bigint;
  endBlock: bigint;
  claimBlock: bigint;
  tickSpacing: bigint;
  validationHook: Address;
  floorPrice: bigint;
  requiredCurrencyRaised: bigint;
  auctionStepsData: Hex;
}

export interface HumanlyCcaCreateTokenParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  tokenData: Hex;
}

export interface HumanlyCcaMigratorParams {
  poolLPFee: number;
  poolTickSpacing: number;
  positionRecipient: Address;
  migrationBlock: bigint;
  initializerFactory: Address;
  tokenSplit: number;
  sweepBlock: bigint;
  operator: Address;
  maxCurrencyAmountForLP: bigint;
}

export interface HumanlyCcaAuctionParams {
  tokensRecipient: Address;
  fundsRecipient: Address;
  startBlock: bigint;
  endBlock: bigint;
  claimBlock: bigint;
  tickSpacing: bigint;
  validationHook: Address;
  floorPrice: bigint;
  requiredCurrencyRaised: bigint;
  auctionStepsData: Hex;
}

export interface HumanlyCcaDistributeTokenParams {
  salt: Hex;
  migratorParams: HumanlyCcaMigratorParams;
  auctionParams: HumanlyCcaAuctionParams;
}

export interface HumanlyCcaParams {
  createTokenParams: HumanlyCcaCreateTokenParams;
  distributeTokenParams: HumanlyCcaDistributeTokenParams;
}

export interface HumanlyBuiltFullRangeLaunchPlan {
  metadata: HumanlyUerc20Metadata;
  price: HumanlyDerivedPriceConfiguration;
  blocks: HumanlyDerivedBlockConfiguration;
  schedule: HumanlyGeneratedSupplySchedule;
  createToken: HumanlyLiquidityLauncherCreateTokenArgs;
  distribution: HumanlyUniswapDistribution;
  migratorParameters: HumanlyUniswapMigratorParameters;
  auctionParameters: HumanlyUniswapAuctionParameters;
  ccaParams: HumanlyCcaParams;
}

export interface HumanlyAbiEncodedLaunchArtifacts {
  tokenData: Hex;
  auctionParameters: Hex;
  fullRangeStrategyConfig: Hex;
  ccaParams: Hex;
}
