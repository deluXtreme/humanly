import type { ApiWorldEnv } from "api";
import type { WebEnv } from "web";

export interface AssetFetcher {
  fetch(input: Request | URL | string): Promise<Response>;
}

export interface HumanlyCloudflareEnv extends ApiWorldEnv, WebEnv {
  ASSETS: AssetFetcher;
  X402_PAY_TO?: string;
  X402_NETWORK?: string;
  X402_AUCTION_INFO_PRICE?: string;
  X402_AUCTION_ACTION_PRICE?: string;
  X402_FACILITATOR_URL?: string;
}
