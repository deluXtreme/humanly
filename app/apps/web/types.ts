import type { HumanlyUniswapLaunchAddressBook } from "uniswap";

export interface WebConfig {
  apiBaseUrl: string;
  worldAction: string;
  host: string;
  port: number;
  previewAddresses: HumanlyUniswapLaunchAddressBook;
}

export interface WebEnv {
  API_BASE_URL?: string;
  WORLD_ACTION?: string;
  HOST?: string;
  PORT?: string;
  PREVIEW_LIQUIDITY_LAUNCHER_ADDRESS?: string;
  PREVIEW_UERC20_FACTORY_ADDRESS?: string;
  PREVIEW_FULL_RANGE_LBP_STRATEGY_FACTORY_ADDRESS?: string;
  PREVIEW_CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS?: string;
}

export type BrowserWebConfig = Pick<
  WebConfig,
  "apiBaseUrl" | "worldAction" | "previewAddresses"
>;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
    __HUMANLY_WEB_CONFIG__?: BrowserWebConfig;
  }
}
