import { describe, expect, test } from "bun:test";

import {
  HUMANLY_ALLOWED_POOL_LP_FEES,
  HUMANLY_ACTION_CONSTANTS_MSG_SENDER,
  HUMANLY_CCA_MPS,
  HUMANLY_ALLOWED_POOL_TICK_SPACINGS,
  HUMANLY_DEFAULT_LAUNCH_NETWORK,
  HUMANLY_FIXED_TOKEN_DECIMALS,
  HUMANLY_Q96,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
  HUMANLY_UNISWAP_LAUNCH_SURFACE,
  getHumanlyLaunchNetworkConfig,
  isHumanlySupportedLaunchNetwork,
} from "./constants.ts";
import {
  assertValidHumanlyFullRangeLaunchInput,
  createDefaultHumanlyFullRangeLaunchInput,
  isHumanlyFullRangeLaunchInputValid,
  validateHumanlyFullRangeLaunchInput,
} from "./validation.ts";
import {
  buildHumanlyEncodedLaunchArtifacts,
  buildHumanlyFullRangeLaunchPlan,
  computeHumanlyCcaSignalHash,
} from "./builders.ts";
import {
  decimalPriceToQ96,
  parseDecimalToUnits,
  roundFloorPriceToTickSpacing,
} from "./math.ts";
import {
  encodeHumanlySupplySchedule,
  generateHumanlySupplySchedule,
} from "./schedule.ts";
import type { HumanlyBuildLaunchContext } from "./types.ts";

describe("humanly uniswap launch surface", () => {
  test("defines a constrained v1 surface", () => {
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.fixed.strategy).toBe(
      "full_range_lbp",
    );
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.fixed.currency).toBe("usdc");
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.fixed.auctionScheduleMode).toBe(
      "generated_convex",
    );
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.fixed.tokenDecimals).toBe(
      HUMANLY_FIXED_TOKEN_DECIMALS,
    );
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.derived.positionRecipient).toBe(
      "creator_wallet",
    );
    expect(HUMANLY_UNISWAP_LAUNCH_SURFACE.derived.scheduleEncoding).toBe(
      "generated_and_packed_uint64_steps",
    );
    expect(HUMANLY_ALLOWED_POOL_LP_FEES).toEqual([100, 500, 3000, 10000]);
    expect(HUMANLY_ALLOWED_POOL_TICK_SPACINGS).toEqual([1, 10, 60, 200]);
  });

  test("defines supported launch networks with runtime metadata", () => {
    expect(HUMANLY_DEFAULT_LAUNCH_NETWORK).toBe("base");
    expect(isHumanlySupportedLaunchNetwork("base")).toBe(true);
    expect(isHumanlySupportedLaunchNetwork("not-a-network")).toBe(false);
    expect(getHumanlyLaunchNetworkConfig("base")).toEqual(
      HUMANLY_SUPPORTED_LAUNCH_NETWORKS.base,
    );
    expect(HUMANLY_SUPPORTED_LAUNCH_NETWORKS.base.chainId).toBe(8453);
    expect(HUMANLY_SUPPORTED_LAUNCH_NETWORKS.sepolia.currencyDecimals).toBe(6);
  });

  test("accepts the default launch draft once token metadata is filled", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";
    input.token.website = "https://humanly.example";
    input.token.image = "https://humanly.example/token.png";

    expect(validateHumanlyFullRangeLaunchInput(input)).toEqual([]);
    expect(isHumanlyFullRangeLaunchInputValid(input)).toBe(true);
    expect(() => assertValidHumanlyFullRangeLaunchInput(input)).not.toThrow();
  });

  test("rejects malformed token and schedule fields", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.network = "not-a-network" as "base";
    input.token.name = "";
    input.token.symbol = "BAD SYMBOL";
    input.token.description = "";
    input.token.website = "http://example.com";
    input.token.image = "not-a-url";
    input.token.initialSupply = "0";
    input.auction.startDelayBlocks = 0;
    input.auction.prebidBlocks = -1;
    input.auction.auctionBlocks = 0;
    input.auction.migrationDelayBlocks = 0;
    input.auction.sweepDelayBlocks = 0;

    const issues = validateHumanlyFullRangeLaunchInput(input);
    const fields = issues.map((issue) => issue.field);

    expect(fields).toContain("network");
    expect(fields).toContain("token.name");
    expect(fields).toContain("token.symbol");
    expect(fields).toContain("token.description");
    expect(fields).toContain("token.website");
    expect(fields).toContain("token.image");
    expect(fields).toContain("token.initialSupply");
    expect(fields).toContain("auction.startDelayBlocks");
    expect(fields).toContain("auction.prebidBlocks");
    expect(fields).toContain("auction.auctionBlocks");
    expect(fields).toContain("auction.migrationDelayBlocks");
    expect(fields).toContain("auction.sweepDelayBlocks");
  });

  test("rejects auction durations that cannot generate a valid schedule", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";
    input.auction.auctionBlocks = 10_000_001;

    const issues = validateHumanlyFullRangeLaunchInput(input);
    const scheduleIssue = issues.find(
      (issue) => issue.field === "auction.auctionBlocks",
    );

    expect(scheduleIssue?.message).toContain(
      "Generated final block MPS is not positive.",
    );
  });

  test("rejects unsupported liquidity values", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";
    input.liquidity.auctionTokenPercentage = 100;
    input.liquidity.poolLpFee = 250 as 100;
    input.liquidity.poolTickSpacing = 42 as 1;
    input.liquidity.maxUsdcForLp = "0";
    input.auction.tickSizeUsdc = "0.02";

    const issues = validateHumanlyFullRangeLaunchInput(input);
    const fields = issues.map((issue) => issue.field);

    expect(fields).toContain("liquidity.auctionTokenPercentage");
    expect(fields).toContain("liquidity.poolLpFee");
    expect(fields).toContain("liquidity.poolTickSpacing");
    expect(fields).toContain("liquidity.maxUsdcForLp");
    expect(fields).toContain("auction.tickSizeUsdc");
  });

  test("rejects precision and uint128-overflow values before encoding", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";
    input.token.initialSupply = "1.1234567890123456789";
    input.auction.requiredUsdcRaised = "0.0000001";
    input.liquidity.maxUsdcForLp = "0.0000001";

    const issues = validateHumanlyFullRangeLaunchInput(input);
    const fields = issues.map((issue) => issue.field);

    expect(fields).toContain("token.initialSupply");
    expect(fields).toContain("auction.requiredUsdcRaised");
    expect(fields).toContain("liquidity.maxUsdcForLp");

    input.token.initialSupply = "999999999999999999999999999999999999999";
    input.auction.requiredUsdcRaised = "999999999999999999999999999999999999999";
    input.liquidity.maxUsdcForLp = "999999999999999999999999999999999999999";

    const overflowIssues = validateHumanlyFullRangeLaunchInput(input);
    const overflowFields = overflowIssues.map((issue) => issue.field);

    expect(overflowFields).toContain("token.initialSupply");
    expect(overflowFields).toContain("auction.requiredUsdcRaised");
    expect(overflowFields).toContain("liquidity.maxUsdcForLp");
  });

  test("converts decimal prices into Q96 and rounds floor price to tick spacing", () => {
    const rawFloor = decimalPriceToQ96("0.1", 18, 6);
    const tick = decimalPriceToQ96("0.001", 18, 6);
    const roundedFloor = roundFloorPriceToTickSpacing(rawFloor, tick);

    expect(rawFloor).toBe((HUMANLY_Q96 * 1n) / (10n * 10n ** 12n));
    expect(roundedFloor % tick).toBe(0n);
    expect(roundedFloor).toBeLessThanOrEqual(rawFloor);
    expect(parseDecimalToUnits("1.25", 6)).toBe(1_250_000n);
  });

  test("generates and encodes a convex supply schedule", () => {
    const generated = generateHumanlySupplySchedule({
      auctionBlocks: 100,
      prebidBlocks: 5,
    });

    const totalMps = generated.schedule.reduce(
      (accumulator, entry) => accumulator + entry.mps * entry.blockDelta,
      0,
    );
    const totalBlocks = generated.schedule.reduce(
      (accumulator, entry) => accumulator + entry.blockDelta,
      0,
    );

    expect(totalMps).toBe(Number(HUMANLY_CCA_MPS));
    expect(totalBlocks).toBe(105);
    expect(generated.schedule[0]).toEqual({ mps: 0, blockDelta: 5 });
    expect(generated.schedule.at(-1)?.blockDelta).toBe(1);
    expect(encodeHumanlySupplySchedule(generated.schedule).startsWith("0x")).toBe(
      true,
    );
  });

  test("builds a future-ready full-range launch plan", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.network = "base";
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";
    input.token.website = "https://humanly.example";
    input.token.image = "https://humanly.example/token.png";
    input.token.initialSupply = "1000000";
    input.auction.startDelayBlocks = 10;
    input.auction.prebidBlocks = 5;
    input.auction.auctionBlocks = 100;
    input.auction.migrationDelayBlocks = 3;
    input.auction.sweepDelayBlocks = 20;
    input.auction.floorPriceUsdc = "0.01";
    input.auction.tickSizeUsdc = "0.0001";
    input.auction.requiredUsdcRaised = "1000";
    input.liquidity.auctionTokenPercentage = 50;
    input.liquidity.maxUsdcForLp = "2500";

    const context: HumanlyBuildLaunchContext = {
      creator: "0x1111111111111111111111111111111111111111",
      currentBlock: 1000,
      addresses: {
        liquidityLauncher: "0x2222222222222222222222222222222222222222",
        uerc20Factory: "0x3333333333333333333333333333333333333333",
        fullRangeLbpStrategyFactory:
          "0x4444444444444444444444444444444444444444",
        continuousClearingAuctionFactory:
          "0x5555555555555555555555555555555555555555",
      },
    };

    const plan = buildHumanlyFullRangeLaunchPlan(input, context);
    const encoded = buildHumanlyEncodedLaunchArtifacts(input, context);

    expect(plan.createToken.recipient).toBe(context.addresses.liquidityLauncher);
    expect(plan.createToken.factory).toBe(context.addresses.uerc20Factory);
    expect(plan.distribution.strategy).toBe(
      context.addresses.fullRangeLbpStrategyFactory,
    );
    expect(plan.auctionParameters.currency).toBe(
      HUMANLY_SUPPORTED_LAUNCH_NETWORKS.base.usdcAddress,
    );
    expect(plan.auctionParameters.fundsRecipient).toBe(
      HUMANLY_ACTION_CONSTANTS_MSG_SENDER,
    );
    expect(plan.blocks.startBlock).toBe(1010n);
    expect(plan.blocks.endBlock).toBe(1115n);
    expect(plan.blocks.claimBlock).toBe(1115n);
    expect(plan.blocks.migrationBlock).toBe(1118n);
    expect(plan.blocks.sweepBlock).toBe(1138n);
    expect(plan.migratorParameters.tokenSplit).toBe(5_000_000n);
    expect(plan.migratorParameters.maxCurrencyAmountForLP).toBe(2_500_000_000n);
    expect(plan.createToken.initialSupply).toBe(1_000_000n * 10n ** 18n);
    expect(plan.price.requiredCurrencyRaised).toBe(1_000_000_000n);
    expect(plan.ccaParams.createTokenParams.name).toBe("Humanly");
    expect(plan.ccaParams.distributeTokenParams.salt.startsWith("0x")).toBe(true);
    expect(encoded.tokenData.startsWith("0x")).toBe(true);
    expect(encoded.auctionParameters.startsWith("0x")).toBe(true);
    expect(encoded.fullRangeStrategyConfig).toBe(plan.distribution.configData);
    expect(encoded.ccaParams.startsWith("0x")).toBe(true);
    expect(
      computeHumanlyCcaSignalHash(context.creator, plan.ccaParams),
    ).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  test("rejects derived block numbers that exceed uint64 bounds", () => {
    const input = createDefaultHumanlyFullRangeLaunchInput();
    input.network = "base";
    input.token.name = "Humanly";
    input.token.symbol = "HUM";
    input.token.description = "Human-first launches with cross-chain bidding.";

    const context: HumanlyBuildLaunchContext = {
      creator: "0x1111111111111111111111111111111111111111",
      currentBlock: 2n ** 64n,
      addresses: {
        liquidityLauncher: "0x2222222222222222222222222222222222222222",
        uerc20Factory: "0x3333333333333333333333333333333333333333",
        fullRangeLbpStrategyFactory:
          "0x4444444444444444444444444444444444444444",
        continuousClearingAuctionFactory:
          "0x5555555555555555555555555555555555555555",
      },
    };

    expect(() => buildHumanlyFullRangeLaunchPlan(input, context)).toThrow(
      "startBlock exceeds uint64 bounds.",
    );
  });
});
