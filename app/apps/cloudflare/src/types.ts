import type { ApiWorldEnv } from "api";
import type { WebEnv } from "web";

export interface AssetFetcher {
  fetch(input: Request | URL | string): Promise<Response>;
}

export interface HumanlyCloudflareEnv extends ApiWorldEnv, WebEnv {
  ASSETS: AssetFetcher;
}
