export interface WebConfig {
  apiBaseUrl: string;
  worldAction: string;
  host: string;
  port: number;
}

export interface WebEnv {
  API_BASE_URL?: string;
  WORLD_ACTION?: string;
  HOST?: string;
  PORT?: string;
}

declare global {
  interface Window {
    __HUMANLY_WEB_CONFIG__?: Pick<WebConfig, "apiBaseUrl" | "worldAction">;
  }
}
