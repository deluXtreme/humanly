import { createApiRouter, createApiWorldConfig } from "api";
import { Hono, type MiddlewareHandler } from "hono";
import { createBrowserWebConfig } from "web";
import type {
  SignWorldRpRequestOptions,
  VerifyWorldProofOptions,
} from "world";

import type { HumanlyCloudflareEnv } from "./types.ts";
import { createAuctionPaymentMiddleware } from "./x402.ts";

export interface CloudflareFetchHandlerOptions
  extends SignWorldRpRequestOptions,
    Pick<VerifyWorldProofOptions, "fetchImplementation"> {
  auctionPaymentMiddleware?: MiddlewareHandler<{
    Bindings: HumanlyCloudflareEnv;
  }>;
}

interface WorkerEntrypoint {
  fetch(
    request: Request,
    env: HumanlyCloudflareEnv,
  ): Promise<Response> | Response;
}

export function createCloudflareFetchHandler(
  options: CloudflareFetchHandlerOptions = {},
) {
  return function fetch(
    request: Request,
    env: HumanlyCloudflareEnv,
  ): Promise<Response> | Response {
    const app = new Hono<{ Bindings: HumanlyCloudflareEnv }>();
    const apiRouter = createApiRouter({
      config: createApiWorldConfig(env),
      signRequestImplementation: options.signRequestImplementation,
      fetchImplementation: options.fetchImplementation,
    });
    const auctionPaymentMiddleware =
      options.auctionPaymentMiddleware ?? createAuctionPaymentMiddleware(env);

    app.get("/healthz", (c) =>
      c.json({
        ok: true,
        service: "humanly-cloudflare",
      }),
    );

    app.get("/config.json", (c) =>
      c.json(
        createBrowserWebConfig(env, {
          defaultApiBaseUrl: "",
        }),
        {
          headers: {
            "cache-control": "no-store",
          },
        },
      ),
    );

    if (auctionPaymentMiddleware) {
      app.use("/api/auctions/*", auctionPaymentMiddleware);
    }

    app.all("/api/*", (c) => apiRouter(c.req.raw));
    app.all("*", (c) => env.ASSETS.fetch(c.req.raw));

    return app.fetch(request, env);
  };
}

export default {
  fetch: createCloudflareFetchHandler(),
} satisfies WorkerEntrypoint;
