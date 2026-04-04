import { createApiWorldConfig } from "./config.ts";
import { createApiRouter } from "./index.ts";

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3010;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error("PORT must be a positive integer if provided.");
  }

  return parsedValue;
}

function createServerFetchHandler() {
  const worldConfig = createApiWorldConfig(process.env);
  const apiRouter = createApiRouter({ config: worldConfig });

  return function fetch(request: Request): Promise<Response> | Response {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        service: "humanly-api",
      });
    }

    return apiRouter(request);
  };
}

export function startApiServer() {
  const port = parsePort(process.env.PORT);
  const hostname = process.env.HOST || "127.0.0.1";

  const server = Bun.serve({
    port,
    hostname,
    fetch: createServerFetchHandler(),
  });

  console.log(`Humanly API listening on http://${server.hostname}:${server.port}`);

  return server;
}

if (import.meta.main) {
  startApiServer();
}
