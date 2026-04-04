import {
  HUMANLY_ALLOWED_POOL_LP_FEES,
  HUMANLY_ALLOWED_POOL_TICK_SPACINGS,
  HUMANLY_AUCTION_SCHEDULE_MODE,
  HUMANLY_DEFAULT_LAUNCH_NETWORK,
  HUMANLY_FIXED_TOKEN_DECIMALS,
  HUMANLY_MAX_UINT40,
  HUMANLY_SUPPORTED_LAUNCH_CURRENCY,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
  HUMANLY_SUPPORTED_LAUNCH_STRATEGY,
  HUMANLY_SUPPORTED_TOKEN_FACTORY,
} from "./constants.ts";
import {
  countDecimalPlaces,
  decimalPriceToQ96,
  fitsUint128Units,
} from "./math.ts";
import type {
  HumanlyFullRangeLaunchInput,
  HumanlyLaunchValidationIssue,
} from "./types.ts";

const DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d+)?$/;
const HTTPS_URL_PROTOCOL = "https:";

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isZeroOrPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isValidDecimalString(value: string): boolean {
  return DECIMAL_PATTERN.test(value.trim());
}

function isZeroOrPositiveDecimalString(value: string): boolean {
  return isValidDecimalString(value) && Number.parseFloat(value) >= 0;
}

function isPositiveDecimalString(value: string): boolean {
  return isValidDecimalString(value) && Number.parseFloat(value) > 0;
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === HTTPS_URL_PROTOCOL;
  } catch {
    return false;
  }
}

function pushIssue(
  issues: HumanlyLaunchValidationIssue[],
  field: HumanlyLaunchValidationIssue["field"],
  message: string,
) {
  issues.push({ field, message });
}

export function createDefaultHumanlyFullRangeLaunchInput(): HumanlyFullRangeLaunchInput {
  return {
    network: HUMANLY_DEFAULT_LAUNCH_NETWORK,
    strategy: HUMANLY_SUPPORTED_LAUNCH_STRATEGY,
    currency: HUMANLY_SUPPORTED_LAUNCH_CURRENCY,
    tokenFactory: HUMANLY_SUPPORTED_TOKEN_FACTORY,
    scheduleMode: HUMANLY_AUCTION_SCHEDULE_MODE,
    token: {
      name: "",
      symbol: "",
      description: "",
      website: "",
      image: "",
      initialSupply: "1000000000",
    },
    auction: {
      startDelayBlocks: 5,
      prebidBlocks: 0,
      auctionBlocks: 100,
      migrationDelayBlocks: 1,
      sweepDelayBlocks: 100,
      floorPriceUsdc: "0.01",
      tickSizeUsdc: "0.0001",
      requiredUsdcRaised: "0",
    },
    liquidity: {
      auctionTokenPercentage: 50,
      poolLpFee: 500,
      poolTickSpacing: 60,
      maxUsdcForLp: "",
    },
  };
}

export function validateHumanlyFullRangeLaunchInput(
  input: HumanlyFullRangeLaunchInput,
): HumanlyLaunchValidationIssue[] {
  const issues: HumanlyLaunchValidationIssue[] = [];

  if (!(input.network in HUMANLY_SUPPORTED_LAUNCH_NETWORKS)) {
    pushIssue(
      issues,
      "network",
      `Network must be one of: ${Object.keys(HUMANLY_SUPPORTED_LAUNCH_NETWORKS).join(", ")}.`,
    );
  }

  if (input.strategy !== HUMANLY_SUPPORTED_LAUNCH_STRATEGY) {
    throw new Error(
      `Only ${HUMANLY_SUPPORTED_LAUNCH_STRATEGY} is supported in the current UI surface.`,
    );
  }

  if (input.currency !== HUMANLY_SUPPORTED_LAUNCH_CURRENCY) {
    throw new Error(
      `Only ${HUMANLY_SUPPORTED_LAUNCH_CURRENCY} launches are supported in the current UI surface.`,
    );
  }

  if (input.tokenFactory !== HUMANLY_SUPPORTED_TOKEN_FACTORY) {
    throw new Error(
      `Only ${HUMANLY_SUPPORTED_TOKEN_FACTORY} token creation is supported in the current UI surface.`,
    );
  }

  if (input.scheduleMode !== HUMANLY_AUCTION_SCHEDULE_MODE) {
    throw new Error(
      `Only ${HUMANLY_AUCTION_SCHEDULE_MODE} auction schedules are supported in the current UI surface.`,
    );
  }

  const tokenName = input.token.name.trim();
  const tokenSymbol = input.token.symbol.trim();
  const tokenDescription = input.token.description.trim();
  const tokenWebsite = input.token.website?.trim() ?? "";
  const tokenImage = input.token.image?.trim() ?? "";
  const initialSupply = input.token.initialSupply.trim();
  const networkConfig =
    input.network in HUMANLY_SUPPORTED_LAUNCH_NETWORKS
      ? HUMANLY_SUPPORTED_LAUNCH_NETWORKS[input.network]
      : HUMANLY_SUPPORTED_LAUNCH_NETWORKS[HUMANLY_DEFAULT_LAUNCH_NETWORK];

  if (tokenName.length === 0 || tokenName.length > 64) {
    pushIssue(issues, "token.name", "Token name must be between 1 and 64 characters.");
  }

  if (!/^[A-Za-z0-9]{1,12}$/.test(tokenSymbol)) {
    pushIssue(
      issues,
      "token.symbol",
      "Token symbol must be 1 to 12 alphanumeric characters with no spaces.",
    );
  }

  if (tokenDescription.length === 0 || tokenDescription.length > 512) {
    pushIssue(
      issues,
      "token.description",
      "Token description must be between 1 and 512 characters.",
    );
  }

  if (tokenWebsite.length > 0 && !isValidHttpsUrl(tokenWebsite)) {
    pushIssue(
      issues,
      "token.website",
      "Website must be a valid https URL if provided.",
    );
  }

  if (tokenImage.length > 0 && !isValidHttpsUrl(tokenImage)) {
    pushIssue(
      issues,
      "token.image",
      "Image must be a valid https URL if provided.",
    );
  }

  if (!isPositiveDecimalString(initialSupply)) {
    pushIssue(
      issues,
      "token.initialSupply",
      "Initial supply must be a positive decimal amount.",
    );
  } else {
    if (countDecimalPlaces(initialSupply) > HUMANLY_FIXED_TOKEN_DECIMALS) {
      pushIssue(
        issues,
        "token.initialSupply",
        `Initial supply cannot use more than ${HUMANLY_FIXED_TOKEN_DECIMALS} decimal places.`,
      );
    }

    if (!fitsUint128Units(initialSupply, HUMANLY_FIXED_TOKEN_DECIMALS)) {
      pushIssue(
        issues,
        "token.initialSupply",
        "Initial supply is too large to fit the launcher uint128 bounds.",
      );
    }
  }

  if (!isPositiveInteger(input.auction.startDelayBlocks)) {
    pushIssue(
      issues,
      "auction.startDelayBlocks",
      "Start delay must be a positive integer number of blocks.",
    );
  }

  if (!isZeroOrPositiveInteger(input.auction.prebidBlocks)) {
    pushIssue(
      issues,
      "auction.prebidBlocks",
      "Prebid blocks must be zero or a positive integer number of blocks.",
    );
  }

  if (
    isZeroOrPositiveInteger(input.auction.prebidBlocks) &&
    BigInt(input.auction.prebidBlocks) > HUMANLY_MAX_UINT40
  ) {
    pushIssue(
      issues,
      "auction.prebidBlocks",
      "Prebid blocks are too large for the packed auction step encoding.",
    );
  }

  if (!isPositiveInteger(input.auction.auctionBlocks)) {
    pushIssue(
      issues,
      "auction.auctionBlocks",
      "Auction duration must be a positive integer number of blocks.",
    );
  }

  if (
    isPositiveInteger(input.auction.auctionBlocks) &&
    BigInt(input.auction.auctionBlocks) > HUMANLY_MAX_UINT40
  ) {
    pushIssue(
      issues,
      "auction.auctionBlocks",
      "Auction duration is too large for the packed auction step encoding.",
    );
  }

  if (!isPositiveInteger(input.auction.migrationDelayBlocks)) {
    pushIssue(
      issues,
      "auction.migrationDelayBlocks",
      "Migration delay must be a positive integer number of blocks.",
    );
  }

  if (!isPositiveInteger(input.auction.sweepDelayBlocks)) {
    pushIssue(
      issues,
      "auction.sweepDelayBlocks",
      "Sweep delay must be a positive integer number of blocks.",
    );
  }

  const floorPriceUsdc = input.auction.floorPriceUsdc.trim();
  const tickSizeUsdc = input.auction.tickSizeUsdc.trim();
  const requiredUsdcRaised = input.auction.requiredUsdcRaised.trim();

  if (!isPositiveDecimalString(floorPriceUsdc)) {
    pushIssue(
      issues,
      "auction.floorPriceUsdc",
      "Floor price must be a positive decimal USDC amount.",
    );
  } else {
    if (countDecimalPlaces(floorPriceUsdc) > HUMANLY_FIXED_TOKEN_DECIMALS) {
      pushIssue(
        issues,
        "auction.floorPriceUsdc",
        `Floor price cannot use more than ${HUMANLY_FIXED_TOKEN_DECIMALS} decimal places.`,
      );
    }

    if (
      decimalPriceToQ96(
        floorPriceUsdc,
        HUMANLY_FIXED_TOKEN_DECIMALS,
        networkConfig.currencyDecimals,
      ) <= 0n
    ) {
      pushIssue(
        issues,
        "auction.floorPriceUsdc",
        "Floor price is too small to represent for the selected network and token decimals.",
      );
    }
  }

  if (!isPositiveDecimalString(tickSizeUsdc)) {
    pushIssue(
      issues,
      "auction.tickSizeUsdc",
      "Tick size must be a positive decimal USDC amount.",
    );
  } else {
    if (countDecimalPlaces(tickSizeUsdc) > HUMANLY_FIXED_TOKEN_DECIMALS) {
      pushIssue(
        issues,
        "auction.tickSizeUsdc",
        `Tick size cannot use more than ${HUMANLY_FIXED_TOKEN_DECIMALS} decimal places.`,
      );
    }

    if (
      decimalPriceToQ96(
        tickSizeUsdc,
        HUMANLY_FIXED_TOKEN_DECIMALS,
        networkConfig.currencyDecimals,
      ) < 2n
    ) {
      pushIssue(
        issues,
        "auction.tickSizeUsdc",
        "Tick size is too small to represent safely in Q96 space.",
      );
    }
  }

  if (
    isPositiveDecimalString(floorPriceUsdc) &&
    isPositiveDecimalString(tickSizeUsdc) &&
    Number.parseFloat(tickSizeUsdc) >= Number.parseFloat(floorPriceUsdc)
  ) {
    pushIssue(
      issues,
      "auction.tickSizeUsdc",
      "Tick size must be smaller than the floor price.",
    );
  }

  if (!isZeroOrPositiveDecimalString(requiredUsdcRaised)) {
    pushIssue(
      issues,
      "auction.requiredUsdcRaised",
      "Required USDC raised must be zero or a positive decimal amount.",
    );
  } else {
    if (countDecimalPlaces(requiredUsdcRaised) > networkConfig.currencyDecimals) {
      pushIssue(
        issues,
        "auction.requiredUsdcRaised",
        `Required USDC raised cannot use more than ${networkConfig.currencyDecimals} decimal places.`,
      );
    }

    if (!fitsUint128Units(requiredUsdcRaised, networkConfig.currencyDecimals)) {
      pushIssue(
        issues,
        "auction.requiredUsdcRaised",
        "Required USDC raised is too large to fit the launcher uint128 bounds.",
      );
    }
  }

  if (
    !Number.isFinite(input.liquidity.auctionTokenPercentage) ||
    input.liquidity.auctionTokenPercentage <= 0 ||
    input.liquidity.auctionTokenPercentage >= 100
  ) {
    pushIssue(
      issues,
      "liquidity.auctionTokenPercentage",
      "Auction token percentage must be greater than 0 and less than 100.",
    );
  }

  if (!HUMANLY_ALLOWED_POOL_LP_FEES.includes(input.liquidity.poolLpFee)) {
    pushIssue(
      issues,
      "liquidity.poolLpFee",
      `Pool LP fee must be one of: ${HUMANLY_ALLOWED_POOL_LP_FEES.join(", ")}.`,
    );
  }

  if (
    !HUMANLY_ALLOWED_POOL_TICK_SPACINGS.includes(input.liquidity.poolTickSpacing)
  ) {
    pushIssue(
      issues,
      "liquidity.poolTickSpacing",
      `Pool tick spacing must be one of: ${HUMANLY_ALLOWED_POOL_TICK_SPACINGS.join(", ")}.`,
    );
  }

  const maxUsdcForLp = input.liquidity.maxUsdcForLp?.trim() ?? "";
  if (maxUsdcForLp.length > 0 && !isPositiveDecimalString(maxUsdcForLp)) {
    pushIssue(
      issues,
      "liquidity.maxUsdcForLp",
      "Max USDC for LP must be a positive decimal amount if provided.",
    );
  } else if (maxUsdcForLp.length > 0) {
    if (countDecimalPlaces(maxUsdcForLp) > networkConfig.currencyDecimals) {
      pushIssue(
        issues,
        "liquidity.maxUsdcForLp",
        `Max USDC for LP cannot use more than ${networkConfig.currencyDecimals} decimal places.`,
      );
    }

    if (!fitsUint128Units(maxUsdcForLp, networkConfig.currencyDecimals)) {
      pushIssue(
        issues,
        "liquidity.maxUsdcForLp",
        "Max USDC for LP is too large to fit the launcher uint128 bounds.",
      );
    }
  }

  return issues;
}

export function isHumanlyFullRangeLaunchInputValid(
  input: HumanlyFullRangeLaunchInput,
): boolean {
  return validateHumanlyFullRangeLaunchInput(input).length === 0;
}

export function assertValidHumanlyFullRangeLaunchInput(
  input: HumanlyFullRangeLaunchInput,
): void {
  const issues = validateHumanlyFullRangeLaunchInput(input);

  if (issues.length === 0) {
    return;
  }

  throw new Error(
    `Invalid Humanly launch input: ${issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join("; ")}`,
  );
}
