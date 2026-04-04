import { isAddress } from "viem";

import type { BrowserWebConfig, WebConfig, WebEnv } from "./types.ts";

const DEFAULT_PREVIEW_ADDRESSES = {
  liquidityLauncher: "0x00000008412db3394C91A5CbD01635c6d140637C",
  uerc20Factory: "0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55",
  fullRangeLbpStrategyFactory: "0x39E5eB34dD2c8082Ee1e556351ae660F33B04252",
  continuousClearingAuctionFactory:
    "0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5",
} as const;

const DEFAULT_HUMANLY_CCA_ADDRESS =
  "0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57" as const;

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

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      "WORLD_GENESIS_ISSUED_AT_MIN must be a positive integer Unix timestamp if provided.",
    );
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

function readRpId(value: string | undefined): `rp_${string}` {
  if (!value || !/^rp_[0-9a-fA-F]+$/.test(value)) {
    throw new Error("WORLD_RP_ID must be provided as an rp_-prefixed hex string.");
  }

  return value as `rp_${string}`;
}

export function createBrowserWebConfig(
  env: WebEnv = {},
  options: BrowserWebConfigOptions = {},
): BrowserWebConfig {
  const source = env as WebEnv;

  return {
    apiBaseUrl: source.API_BASE_URL ?? options.defaultApiBaseUrl ?? "",
    worldAction: source.WORLD_ACTION ?? "create-auction",
    worldRpId: readRpId(source.WORLD_RP_ID),
    worldGenesisIssuedAtMin: parseOptionalPositiveInteger(
      source.WORLD_GENESIS_ISSUED_AT_MIN,
    ),
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
    humanlyCcaAddress: readAddress(
      source.HUMANLY_CCA_ADDRESS,
      DEFAULT_HUMANLY_CCA_ADDRESS,
      "HUMANLY_CCA_ADDRESS",
    ),
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
