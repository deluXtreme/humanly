import { isAddress } from "viem";

import type { BrowserWebConfig, WebConfig, WebEnv } from "./types.ts";

const DEFAULT_PREVIEW_ADDRESSES = {
  liquidityLauncher: "0x1111111111111111111111111111111111111111",
  uerc20Factory: "0x2222222222222222222222222222222222222222",
  fullRangeLbpStrategyFactory: "0x3333333333333333333333333333333333333333",
  continuousClearingAuctionFactory:
    "0x4444444444444444444444444444444444444444",
} as const;

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3011;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error("PORT must be a positive integer if provided.");
  }

  return parsedValue;
}

function readAddress(
  value: string | undefined,
  fallback: `0x${string}`,
  label: string,
): `0x${string}` {
  const candidate = value ?? fallback;

  if (!isAddress(candidate)) {
    throw new Error(`${label} must be a valid 0x-prefixed address.`);
  }

  return candidate as `0x${string}`;
}

interface BrowserWebConfigOptions {
  defaultApiBaseUrl?: string;
}

export function createBrowserWebConfig(
  env: WebEnv = {},
  options: BrowserWebConfigOptions = {},
): BrowserWebConfig {
  const source = env as WebEnv;

  return {
    apiBaseUrl: source.API_BASE_URL ?? options.defaultApiBaseUrl ?? "",
    worldAction: source.WORLD_ACTION ?? "create-auction",
    previewAddresses: {
      liquidityLauncher: readAddress(
        source.PREVIEW_LIQUIDITY_LAUNCHER_ADDRESS,
        DEFAULT_PREVIEW_ADDRESSES.liquidityLauncher,
        "PREVIEW_LIQUIDITY_LAUNCHER_ADDRESS",
      ),
      uerc20Factory: readAddress(
        source.PREVIEW_UERC20_FACTORY_ADDRESS,
        DEFAULT_PREVIEW_ADDRESSES.uerc20Factory,
        "PREVIEW_UERC20_FACTORY_ADDRESS",
      ),
      fullRangeLbpStrategyFactory: readAddress(
        source.PREVIEW_FULL_RANGE_LBP_STRATEGY_FACTORY_ADDRESS,
        DEFAULT_PREVIEW_ADDRESSES.fullRangeLbpStrategyFactory,
        "PREVIEW_FULL_RANGE_LBP_STRATEGY_FACTORY_ADDRESS",
      ),
      continuousClearingAuctionFactory: readAddress(
        source.PREVIEW_CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS,
        DEFAULT_PREVIEW_ADDRESSES.continuousClearingAuctionFactory,
        "PREVIEW_CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS",
      ),
    },
  };
}

export function createWebConfig(env: WebEnv = {}): WebConfig {
  const source = env as WebEnv;

  return {
    ...createBrowserWebConfig(source, {
      defaultApiBaseUrl: "http://127.0.0.1:3010",
    }),
    host: source.HOST ?? "127.0.0.1",
    port: parsePort(source.PORT),
  };
}
