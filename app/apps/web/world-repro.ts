import QRCode from "qrcode";
import {
  createWorldBridgeRequest,
  createWorldBridgeV4Payload,
} from "world/browser";

import type { BrowserWebConfig } from "./types.ts";

interface RpContextResponse {
  app_id: `app_${string}`;
  action: string;
  allow_legacy_proofs: boolean;
  rp_context: {
    rp_id: `rp_${string}`;
    nonce: `0x${string}`;
    created_at: number;
    expires_at: number;
    signature: `0x${string}`;
  };
}

interface IdKitCompletionSuccess {
  success: true;
  result: unknown;
  rawResult: unknown;
}

interface IdKitCompletionFailure {
  success: false;
  error?: string;
  rawResult?: unknown;
}

type IdKitCompletion = IdKitCompletionSuccess | IdKitCompletionFailure;

let browserConfigPromise: Promise<BrowserWebConfig> | undefined;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element as T;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_, currentValue) =>
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    2,
  );
}

function setStatus(message: string, kind: "idle" | "success" | "error" = "idle") {
  const status = requireElement<HTMLElement>("[data-status]");
  status.textContent = message;
  status.dataset.kind = kind;
}

function setJsonOutput(title: string, value: unknown) {
  const label = requireElement<HTMLElement>("[data-output-label]");
  const output = requireElement<HTMLElement>("[data-output]");
  label.textContent = title;
  output.textContent = stringifyJson(value);
}

async function loadBrowserConfig(): Promise<BrowserWebConfig> {
  if (window.__HUMANLY_WEB_CONFIG__) {
    return window.__HUMANLY_WEB_CONFIG__;
  }

  const response = await fetch("/config.json");
  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      (json as { error?: string }).error ??
        "Failed to load browser runtime config.",
    );
  }

  return json as BrowserWebConfig;
}

async function getBrowserConfig(): Promise<BrowserWebConfig> {
  browserConfigPromise ??= loadBrowserConfig();
  return browserConfigPromise;
}

function clearConnectorUi() {
  const connectorAnchor = requireElement<HTMLAnchorElement>("[data-connector]");
  const connectorPanel = requireElement<HTMLElement>("[data-connector-panel]");
  const connectorQr = requireElement<HTMLImageElement>("[data-connector-qr]");

  connectorAnchor.href = "#";
  connectorAnchor.hidden = true;
  connectorQr.removeAttribute("src");
  connectorPanel.hidden = true;
}

async function renderConnectorUi(connectorUri: string) {
  const connectorAnchor = requireElement<HTMLAnchorElement>("[data-connector]");
  const connectorPanel = requireElement<HTMLElement>("[data-connector-panel]");
  const connectorQr = requireElement<HTMLImageElement>("[data-connector-qr]");

  const qrDataUrl = await QRCode.toDataURL(connectorUri, {
    width: 420,
    margin: 2,
    color: {
      dark: "#18211f",
      light: "#fffaf0",
    },
  });

  connectorAnchor.href = connectorUri;
  connectorAnchor.hidden = false;
  connectorQr.src = qrDataUrl;
  connectorPanel.hidden = false;
}

function getAction(): string {
  const input = requireElement<HTMLInputElement>("[data-action-input]");
  const value = input.value.trim();

  if (value.length === 0) {
    throw new Error("Action must not be empty.");
  }

  return value;
}

function getSignal(): string | undefined {
  const input = requireElement<HTMLInputElement>("[data-signal-input]");
  const value = input.value.trim();
  return value.length > 0 ? value : undefined;
}

function getGenesisIssuedAtMin(
  config: BrowserWebConfig,
): number | undefined {
  const input = requireElement<HTMLInputElement>("[data-genesis-input]");
  const value = input.value.trim();

  if (value.length === 0) {
    return config.worldGenesisIssuedAtMin;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      "genesis_issued_at_min must be a positive Unix timestamp when provided.",
    );
  }

  return parsed;
}

async function requestRpContext(
  apiBaseUrl: string,
  action: string,
): Promise<RpContextResponse> {
  const response = await fetch(`${apiBaseUrl}/api/worldid/rp-context`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ action }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "Failed to request World RP context.");
  }

  const rpContext = json as RpContextResponse;

  return {
    ...rpContext,
    rp_context: {
      ...rpContext.rp_context,
      created_at: Number(rpContext.rp_context.created_at),
      expires_at: Number(rpContext.rp_context.expires_at),
    },
  };
}

function getIdKitFailureMessage(completion: IdKitCompletionFailure): string {
  if (completion.error === "verification_rejected") {
    return "World verification was not completed: verification_rejected";
  }

  if (completion.error) {
    return `World verification was not completed: ${completion.error}`;
  }

  return "World verification did not complete.";
}

async function runMinimalWorldRepro() {
  const config = await getBrowserConfig();
  const action = getAction();
  const signal = getSignal();
  const genesisIssuedAtMin = getGenesisIssuedAtMin(config);

  clearConnectorUi();

  setStatus("Requesting RP context...");
  const rpContext = await requestRpContext(config.apiBaseUrl, action);
  setJsonOutput("RP Context", rpContext);

  const requestPayload = createWorldBridgeV4Payload({
    appId: rpContext.app_id,
    action: rpContext.action,
    rpContext: rpContext.rp_context,
    signal,
    genesisIssuedAtMin,
    environment: "production",
  });

  setStatus("Creating minimal World bridge request...");
  const request = await createWorldBridgeRequest({
    appId: rpContext.app_id,
    action: rpContext.action,
    rpContext: rpContext.rp_context,
    signal,
    genesisIssuedAtMin,
    environment: "production",
  });

  await renderConnectorUi(request.connectorURI);
  setJsonOutput("Connector Request", {
    requestId: request.requestId,
    connectorURI: request.connectorURI,
    requestPayload,
    action,
    allow_legacy_proofs: false,
    signal: signal ?? null,
    genesis_issued_at_min: genesisIssuedAtMin ?? null,
  });

  setStatus("Waiting for World App completion...");
  const completion = (await request.pollUntilCompletion()) as IdKitCompletion;
  setJsonOutput("IDKit Result", completion);

  if (!completion.success) {
    throw new Error(getIdKitFailureMessage(completion));
  }

  setStatus("Minimal repro completed.", "success");
}

function applyConfigDefaults(config: BrowserWebConfig) {
  requireElement<HTMLInputElement>("[data-action-input]").value =
    config.worldAction;

  if (config.worldGenesisIssuedAtMin) {
    requireElement<HTMLInputElement>("[data-genesis-input]").value = String(
      config.worldGenesisIssuedAtMin,
    );
  }

  setJsonOutput("Minimal Repro Config", {
    worldAction: config.worldAction,
    worldRpId: config.worldRpId,
    worldGenesisIssuedAtMin: config.worldGenesisIssuedAtMin ?? null,
  });
}

async function main() {
  try {
    const config = await getBrowserConfig();
    applyConfigDefaults(config);
    clearConnectorUi();
    setStatus("Ready to start the minimal World repro.");

    requireElement<HTMLButtonElement>("[data-run-button]").addEventListener(
      "click",
      async () => {
        setStatus("Starting minimal World repro...");

        try {
          await runMinimalWorldRepro();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown repro failure.";
          setStatus(message, "error");
        }
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize repro.";
    setStatus(message, "error");
    setJsonOutput("Initialization Error", {
      error: message,
    });
  }
}

void main();
