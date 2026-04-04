import { createApiRouter, createApiWorldConfig } from "api";
import { createBrowserWebConfig } from "web";
import type {
  SignWorldRpRequestOptions,
  VerifyWorldProofOptions,
} from "world";

import type { HumanlyCloudflareEnv } from "./types.ts";

export interface CloudflareFetchHandlerOptions
  extends SignWorldRpRequestOptions,
    Pick<VerifyWorldProofOptions, "fetchImplementation"> {}

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
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        service: "humanly-cloudflare",
      });
    }

    if (url.pathname === "/config.json") {
      return Response.json(
        createBrowserWebConfig(env, {
          defaultApiBaseUrl: "",
        }),
        {
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    }

    if (url.pathname.startsWith("/api/")) {
      const apiRouter = createApiRouter({
        config: createApiWorldConfig(env),
        signRequestImplementation: options.signRequestImplementation,
        fetchImplementation: options.fetchImplementation,
      });

      return apiRouter(request);
    }

    return env.ASSETS.fetch(request);
  };
}

export default {
  fetch: createCloudflareFetchHandler(),
} satisfies WorkerEntrypoint;
