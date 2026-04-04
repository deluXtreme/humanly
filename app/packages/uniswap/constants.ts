export const HUMANLY_SUPPORTED_LAUNCH_STRATEGY = "full_range_lbp" as const;
export const HUMANLY_SUPPORTED_LAUNCH_CURRENCY = "usdc" as const;
export const HUMANLY_SUPPORTED_TOKEN_FACTORY = "uerc20" as const;
export const HUMANLY_FIXED_TOKEN_DECIMALS = 18 as const;
export const HUMANLY_AUCTION_SCHEDULE_MODE = "generated_convex" as const;
export const HUMANLY_ALLOWED_POOL_LP_FEES = [100, 500, 3000, 10_000] as const;
export const HUMANLY_ALLOWED_POOL_TICK_SPACINGS = [1, 10, 60, 200] as const;
export const HUMANLY_DEFAULT_LAUNCH_NETWORK = "base" as const;

export const HUMANLY_SUPPORTED_LAUNCH_NETWORKS = {
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    blockTimeSeconds: 12,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    currencyDecimals: 6,
  },
  unichain: {
    chainId: 130,
    name: "Unichain",
    blockTimeSeconds: 1,
    rpcUrl: "https://mainnet.unichain.org",
    usdcAddress: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    currencyDecimals: 6,
  },
  unichainSepolia: {
    chainId: 1301,
    name: "Unichain Sepolia",
    blockTimeSeconds: 2,
    rpcUrl: "https://sepolia.unichain.org",
    usdcAddress: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    currencyDecimals: 6,
  },
  base: {
    chainId: 8453,
    name: "Base",
    blockTimeSeconds: 2,
    rpcUrl: "https://mainnet.base.org",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    currencyDecimals: 6,
  },
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum",
    blockTimeSeconds: 2,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    usdcAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    currencyDecimals: 6,
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    blockTimeSeconds: 12,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    currencyDecimals: 6,
  },
} as const;

export const HUMANLY_CCA_MPS = 10_000_000n;
export const HUMANLY_Q96 = 79_228_162_514_264_337_593_543_950_336n;
export const HUMANLY_MIN_TICK_SPACING_Q96 = 2n;
export const HUMANLY_MAX_UINT24 = (2n ** 24n) - 1n;
export const HUMANLY_MAX_UINT40 = (2n ** 40n) - 1n;
export const HUMANLY_MAX_UINT64 = (2n ** 64n) - 1n;
export const HUMANLY_MAX_UINT128 = (2n ** 128n) - 1n;
export const HUMANLY_ACTION_CONSTANTS_MSG_SENDER =
  "0x0000000000000000000000000000000000000001" as const;
export const HUMANLY_ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;
export const HUMANLY_DEFAULT_SCHEDULE_STEP_COUNT = 12;
export const HUMANLY_DEFAULT_SCHEDULE_ALPHA = 1.2;
export const HUMANLY_DEFAULT_MAIN_SUPPLY_PERCENT = 70;

export function isHumanlySupportedLaunchNetwork(
  value: string,
): value is keyof typeof HUMANLY_SUPPORTED_LAUNCH_NETWORKS {
  return value in HUMANLY_SUPPORTED_LAUNCH_NETWORKS;
}

export function getHumanlyLaunchNetworkConfig(
  network: keyof typeof HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
) {
  return HUMANLY_SUPPORTED_LAUNCH_NETWORKS[network];
}

export const HUMANLY_UNISWAP_LAUNCH_SURFACE = {
  fixed: {
    strategy: HUMANLY_SUPPORTED_LAUNCH_STRATEGY,
    currency: HUMANLY_SUPPORTED_LAUNCH_CURRENCY,
    tokenFactory: HUMANLY_SUPPORTED_TOKEN_FACTORY,
    tokenDecimals: HUMANLY_FIXED_TOKEN_DECIMALS,
    auctionScheduleMode: HUMANLY_AUCTION_SCHEDULE_MODE,
    createAndDistributeAtomically: true,
    payerIsUser: false,
    validationHook: "disabled",
  },
  derived: {
    tokenRecipient: "liquidity_launcher",
    fundsRecipient: "strategy_self",
    tokensRecipient: "creator_wallet",
    positionRecipient: "creator_wallet",
    operator: "creator_wallet",
    claimBlockMode: "same_as_end_block",
    launchCurrencyAsset: "usdc",
    scheduleEncoding: "generated_and_packed_uint64_steps",
  },
  userConfigurable: [
    "network",
    "token.name",
    "token.symbol",
    "token.description",
    "token.website",
    "token.image",
    "token.initialSupply",
    "auction.startDelayBlocks",
    "auction.prebidBlocks",
    "auction.auctionBlocks",
    "auction.migrationDelayBlocks",
    "auction.sweepDelayBlocks",
    "auction.floorPriceUsdc",
    "auction.tickSizeUsdc",
    "auction.requiredUsdcRaised",
    "liquidity.auctionTokenPercentage",
    "liquidity.poolLpFee",
    "liquidity.poolTickSpacing",
    "liquidity.maxUsdcForLp",
  ] as const,
} as const;
