import type { ApiWorldConfig, ApiWorldEnv } from "./types.ts";

function readRequiredEnv(
  env: ApiWorldEnv,
  key: keyof ApiWorldEnv,
): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required World environment variable: ${key}`);
  }

  return value;
}

function parseAllowedActions(serializedActions: string): string[] {
  const actions = serializedActions
    .split(",")
    .map((action) => action.trim())
    .filter(Boolean);

  if (actions.length === 0) {
    throw new Error(
      "WORLD_ALLOWED_ACTIONS must contain at least one comma-separated action.",
    );
  }

  return actions;
}

function parseOptionalPositiveInteger(
  value: string | undefined,
  key: keyof ApiWorldEnv,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${key} must be a positive integer if provided.`);
  }

  return parsedValue;
}

export function createApiWorldConfig(
  env: ApiWorldEnv = {},
): ApiWorldConfig {
  return {
    appId: readRequiredEnv(env, "WORLD_APP_ID") as `app_${string}`,
    rpId: readRequiredEnv(env, "WORLD_RP_ID") as `rp_${string}`,
    signingKeyHex: readRequiredEnv(env, "WORLD_RP_SIGNING_KEY") as `0x${string}`,
    allowedActions: parseAllowedActions(
      readRequiredEnv(env, "WORLD_ALLOWED_ACTIONS"),
    ),
    rpContextTtlSeconds: parseOptionalPositiveInteger(
      env.WORLD_RP_TTL_SECONDS,
      "WORLD_RP_TTL_SECONDS",
    ),
    verifyApiBaseUrl: env.WORLD_VERIFY_API_BASE_URL,
  };
}

export function assertWorldActionAllowed(
  action: string,
  config: Pick<ApiWorldConfig, "allowedActions">,
): void {
  if (!config.allowedActions.includes(action)) {
    throw new Error(`World action is not allowed by server config: ${action}`);
  }
}
