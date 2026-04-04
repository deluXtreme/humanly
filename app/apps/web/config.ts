import type { WebConfig, WebEnv } from "./types.ts";

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

export function createWebConfig(env: WebEnv = process.env): WebConfig {
  return {
    apiBaseUrl: env.API_BASE_URL ?? "http://127.0.0.1:3010",
    worldAction: env.WORLD_ACTION ?? "create-auction",
    host: env.HOST ?? "127.0.0.1",
    port: parsePort(env.PORT),
  };
}
