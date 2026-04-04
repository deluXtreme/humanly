import { abiEncode } from "./abi.ts";
import { getAddress, isAddress } from "viem";
import {
  HUMANLY_ACTION_CONSTANTS_MSG_SENDER,
  HUMANLY_FIXED_TOKEN_DECIMALS,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
  HUMANLY_ZERO_ADDRESS,
} from "./constants.ts";
import {
  decimalPriceToQ96,
  parseDecimalToUnits,
  percentageToMps,
  roundFloorPriceToTickSpacing,
} from "./math.ts";
import {
  encodeHumanlySupplySchedule,
  generateHumanlySupplySchedule,
} from "./schedule.ts";
import { assertValidHumanlyFullRangeLaunchInput } from "./validation.ts";
import type {
  HumanlyAbiEncodedLaunchArtifacts,
  HumanlyBuildLaunchContext,
  HumanlyBuiltFullRangeLaunchPlan,
  HumanlyDerivedBlockConfiguration,
  HumanlyDerivedPriceConfiguration,
  HumanlyFullRangeLaunchInput,
  HumanlyLiquidityLauncherCreateTokenArgs,
  HumanlyUerc20Metadata,
  HumanlyUniswapAuctionParameters,
  HumanlyUniswapDistribution,
  HumanlyUniswapMigratorParameters,
} from "./types.ts";

function assertAddress(value: string, label: string): asserts value is `0x${string}` {
  if (!isAddress(value)) {
    throw new Error(`${label} must be a valid 20-byte hex address.`);
  }
}

function normalizeBlock(value: number | bigint): bigint {
  const block = typeof value === "bigint" ? value : BigInt(value);

  if (block < 0n) {
    throw new Error("currentBlock cannot be negative.");
  }

  return block;
}

export const LIQUIDITY_LAUNCHER_FUNCTION_SIGNATURES = [
  "function createToken(address factory,string name,string symbol,uint8 decimals,uint128 initialSupply,address recipient,bytes tokenData) returns (address tokenAddress)",
  "function distributeToken(address tokenAddress,(address strategy,uint128 amount,bytes configData) distribution,bool payerIsUser,bytes32 salt) returns (address distributionContract)",
  "function multicall(bytes[] data) returns (bytes[] results)",
] as const;

export function createHumanlyUerc20Metadata(
  input: HumanlyFullRangeLaunchInput,
): HumanlyUerc20Metadata {
  return {
    description: input.token.description.trim(),
    website: input.token.website?.trim() ?? "",
    image: input.token.image?.trim() ?? "",
  };
}

export function encodeHumanlyUerc20Metadata(
  metadata: HumanlyUerc20Metadata,
): `0x${string}` {
  return abiEncode([
    { type: "string", value: metadata.description },
    { type: "string", value: metadata.website },
    { type: "string", value: metadata.image },
  ]);
}

export function deriveHumanlyLaunchPricing(
  input: HumanlyFullRangeLaunchInput,
): HumanlyDerivedPriceConfiguration {
  const network = HUMANLY_SUPPORTED_LAUNCH_NETWORKS[input.network];

  const rawFloorPriceQ96 = decimalPriceToQ96(
    input.auction.floorPriceUsdc,
    HUMANLY_FIXED_TOKEN_DECIMALS,
    network.currencyDecimals,
  );
  const rawTickSpacingQ96 = decimalPriceToQ96(
    input.auction.tickSizeUsdc,
    HUMANLY_FIXED_TOKEN_DECIMALS,
    network.currencyDecimals,
  );
  const floorPriceQ96 = roundFloorPriceToTickSpacing(
    rawFloorPriceQ96,
    rawTickSpacingQ96,
  );

  return {
    currencyDecimals: network.currencyDecimals,
    tokenDecimals: HUMANLY_FIXED_TOKEN_DECIMALS,
    rawFloorPriceQ96,
    floorPriceQ96,
    rawTickSpacingQ96,
    tickSpacingQ96: rawTickSpacingQ96,
    requiredCurrencyRaised: parseDecimalToUnits(
      input.auction.requiredUsdcRaised,
      network.currencyDecimals,
    ),
  };
}

export function deriveHumanlyLaunchBlocks(
  input: HumanlyFullRangeLaunchInput,
  currentBlock: number | bigint,
): HumanlyDerivedBlockConfiguration {
  const block = normalizeBlock(currentBlock);

  const startBlock = block + BigInt(input.auction.startDelayBlocks);
  const endBlock =
    startBlock +
    BigInt(input.auction.prebidBlocks + input.auction.auctionBlocks);
  const claimBlock = endBlock;
  const migrationBlock = endBlock + BigInt(input.auction.migrationDelayBlocks);
  const sweepBlock = migrationBlock + BigInt(input.auction.sweepDelayBlocks);

  return {
    startBlock,
    endBlock,
    claimBlock,
    migrationBlock,
    sweepBlock,
  };
}

export function buildHumanlyCreateTokenArgs(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyLiquidityLauncherCreateTokenArgs {
  assertAddress(context.addresses.liquidityLauncher, "liquidityLauncher");
  assertAddress(context.addresses.uerc20Factory, "uerc20Factory");

  return {
    factory: getAddress(context.addresses.uerc20Factory),
    name: input.token.name.trim(),
    symbol: input.token.symbol.trim(),
    decimals: HUMANLY_FIXED_TOKEN_DECIMALS,
    initialSupply: parseDecimalToUnits(
      input.token.initialSupply,
      HUMANLY_FIXED_TOKEN_DECIMALS,
    ),
    recipient: getAddress(context.addresses.liquidityLauncher),
    tokenData: encodeHumanlyUerc20Metadata(createHumanlyUerc20Metadata(input)),
  };
}

export function buildHumanlyAuctionParameters(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyUniswapAuctionParameters {
  const network = HUMANLY_SUPPORTED_LAUNCH_NETWORKS[input.network];
  const creator = context.creator;
  const price = deriveHumanlyLaunchPricing(input);
  const blocks = deriveHumanlyLaunchBlocks(input, context.currentBlock);
  const schedule = generateHumanlySupplySchedule({
    auctionBlocks: input.auction.auctionBlocks,
    prebidBlocks: input.auction.prebidBlocks,
  });

  assertAddress(creator, "creator");

  return {
    currency: getAddress(network.usdcAddress),
    tokensRecipient: getAddress(creator),
    fundsRecipient: HUMANLY_ACTION_CONSTANTS_MSG_SENDER,
    startBlock: blocks.startBlock,
    endBlock: blocks.endBlock,
    claimBlock: blocks.claimBlock,
    tickSpacing: price.tickSpacingQ96,
    validationHook: HUMANLY_ZERO_ADDRESS,
    floorPrice: price.floorPriceQ96,
    requiredCurrencyRaised: price.requiredCurrencyRaised,
    auctionStepsData: encodeHumanlySupplySchedule(schedule.schedule),
  };
}

export function encodeHumanlyAuctionParameters(
  parameters: HumanlyUniswapAuctionParameters,
): `0x${string}` {
  return abiEncode([
    { type: "address", value: parameters.currency },
    { type: "address", value: parameters.tokensRecipient },
    { type: "address", value: parameters.fundsRecipient },
    { type: "uint64", value: parameters.startBlock },
    { type: "uint64", value: parameters.endBlock },
    { type: "uint64", value: parameters.claimBlock },
    { type: "uint256", value: parameters.tickSpacing },
    { type: "address", value: parameters.validationHook },
    { type: "uint256", value: parameters.floorPrice },
    { type: "uint128", value: parameters.requiredCurrencyRaised },
    { type: "bytes", value: parameters.auctionStepsData },
  ]);
}

export function buildHumanlyMigratorParameters(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyUniswapMigratorParameters {
  const network = HUMANLY_SUPPORTED_LAUNCH_NETWORKS[input.network];
  const blocks = deriveHumanlyLaunchBlocks(input, context.currentBlock);

  assertAddress(context.creator, "creator");
  assertAddress(
    context.addresses.continuousClearingAuctionFactory,
    "continuousClearingAuctionFactory",
  );

  return {
    migrationBlock: blocks.migrationBlock,
    currency: getAddress(network.usdcAddress),
    poolLPFee: input.liquidity.poolLpFee,
    poolTickSpacing: input.liquidity.poolTickSpacing,
    tokenSplit: percentageToMps(input.liquidity.auctionTokenPercentage),
    initializerFactory: getAddress(
      context.addresses.continuousClearingAuctionFactory,
    ),
    positionRecipient: getAddress(context.creator),
    sweepBlock: blocks.sweepBlock,
    operator: getAddress(context.creator),
    maxCurrencyAmountForLP:
      (input.liquidity.maxUsdcForLp?.trim().length ?? 0) > 0
        ? parseDecimalToUnits(
            input.liquidity.maxUsdcForLp!,
            network.currencyDecimals,
          )
        : (2n ** 128n) - 1n,
  };
}

export function encodeHumanlyMigratorParameters(
  parameters: HumanlyUniswapMigratorParameters,
): `0x${string}` {
  return abiEncode([
    { type: "uint64", value: parameters.migrationBlock },
    { type: "address", value: parameters.currency },
    { type: "uint24", value: parameters.poolLPFee },
    { type: "uint24", value: parameters.poolTickSpacing },
    { type: "uint24", value: parameters.tokenSplit },
    { type: "address", value: parameters.initializerFactory },
    { type: "address", value: parameters.positionRecipient },
    { type: "uint64", value: parameters.sweepBlock },
    { type: "address", value: parameters.operator },
    { type: "uint128", value: parameters.maxCurrencyAmountForLP },
  ]);
}

export function encodeHumanlyFullRangeStrategyConfig(
  migratorParameters: HumanlyUniswapMigratorParameters,
  auctionParameters: HumanlyUniswapAuctionParameters,
): `0x${string}` {
  return abiEncode([
    { type: "uint64", value: migratorParameters.migrationBlock },
    { type: "address", value: migratorParameters.currency },
    { type: "uint24", value: migratorParameters.poolLPFee },
    { type: "uint24", value: migratorParameters.poolTickSpacing },
    { type: "uint24", value: migratorParameters.tokenSplit },
    { type: "address", value: migratorParameters.initializerFactory },
    { type: "address", value: migratorParameters.positionRecipient },
    { type: "uint64", value: migratorParameters.sweepBlock },
    { type: "address", value: migratorParameters.operator },
    { type: "uint128", value: migratorParameters.maxCurrencyAmountForLP },
    { type: "bytes", value: encodeHumanlyAuctionParameters(auctionParameters) },
  ]);
}

export function buildHumanlyDistribution(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyUniswapDistribution {
  assertAddress(
    context.addresses.fullRangeLbpStrategyFactory,
    "fullRangeLbpStrategyFactory",
  );

  const createToken = buildHumanlyCreateTokenArgs(input, context);
  const migratorParameters = buildHumanlyMigratorParameters(input, context);
  const auctionParameters = buildHumanlyAuctionParameters(input, context);

  return {
    strategy: getAddress(context.addresses.fullRangeLbpStrategyFactory),
    amount: createToken.initialSupply,
    configData: encodeHumanlyFullRangeStrategyConfig(
      migratorParameters,
      auctionParameters,
    ),
  };
}

export function buildHumanlyFullRangeLaunchPlan(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyBuiltFullRangeLaunchPlan {
  assertValidHumanlyFullRangeLaunchInput(input);

  const schedule = generateHumanlySupplySchedule({
    auctionBlocks: input.auction.auctionBlocks,
    prebidBlocks: input.auction.prebidBlocks,
  });
  const metadata = createHumanlyUerc20Metadata(input);
  const price = deriveHumanlyLaunchPricing(input);
  const blocks = deriveHumanlyLaunchBlocks(input, context.currentBlock);
  const createToken = buildHumanlyCreateTokenArgs(input, context);
  const auctionParameters = buildHumanlyAuctionParameters(input, context);
  const migratorParameters = buildHumanlyMigratorParameters(input, context);
  const distribution = {
    strategy: getAddress(context.addresses.fullRangeLbpStrategyFactory),
    amount: createToken.initialSupply,
    configData: encodeHumanlyFullRangeStrategyConfig(
      migratorParameters,
      auctionParameters,
    ),
  };

  return {
    metadata,
    price,
    blocks,
    schedule,
    createToken,
    distribution,
    migratorParameters,
    auctionParameters,
  };
}

export function buildHumanlyEncodedLaunchArtifacts(
  input: HumanlyFullRangeLaunchInput,
  context: HumanlyBuildLaunchContext,
): HumanlyAbiEncodedLaunchArtifacts {
  const plan = buildHumanlyFullRangeLaunchPlan(input, context);

  return {
    tokenData: plan.createToken.tokenData,
    auctionParameters: encodeHumanlyAuctionParameters(plan.auctionParameters),
    fullRangeStrategyConfig: plan.distribution.configData,
  };
}
