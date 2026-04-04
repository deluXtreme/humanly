import { handleAuctionRequest, matchAuctionRoute } from "./auction.ts";
import {
  handleWorldRpContextRequest,
  handleWorldVerifyRequest,
} from "./handlers.ts";
import type { ApiRouterOptions } from "./types.ts";

export * from "./config.ts";
export * from "./handlers.ts";
export * from "./types.ts";
export * from "./auction.ts";

export function createApiRouter(options: ApiRouterOptions) {
  return function fetch(request: Request): Promise<Response> | Response {
    const url = new URL(request.url);
    const auctionRoute = matchAuctionRoute(url.pathname);

    if (auctionRoute) {
      return handleAuctionRequest(request, auctionRoute, options);
    }

    if (url.pathname === "/api/worldid/rp-context") {
      return handleWorldRpContextRequest(request, options);
    }

    if (url.pathname === "/api/worldid/verify") {
      return handleWorldVerifyRequest(request, options);
    }

    return new Response("Not found", { status: 404 });
  };
}
