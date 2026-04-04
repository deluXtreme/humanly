import { IDKit, orbLegacy } from "@worldcoin/idkit-core";
import QRCode from "qrcode";

interface RpContextResponse {
  app_id: string;
  action: string;
  allow_legacy_proofs: true;
  rp_context: {
    rp_id: string;
    nonce: string;
    created_at: number | string;
    expires_at: number | string;
    signature: string;
  };
}

interface VerificationResponse {
  success: boolean;
  action?: string;
  nullifier?: string;
  message?: string;
}

interface IdKitCompletionSuccess {
  success: true;
  result: unknown;
}

interface IdKitCompletionFailure {
  success: false;
  error?: string;
}

type IdKitCompletion = IdKitCompletionSuccess | IdKitCompletionFailure;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element as T;
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
  output.textContent = JSON.stringify(value, null, 2);
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

async function requestRpContext(
  apiBaseUrl: string,
  action: string,
  signal?: string,
): Promise<RpContextResponse> {
  const response = await fetch(`${apiBaseUrl}/api/worldid/rp-context`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action,
      signal,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "Failed to request World RP context.");
  }

  return json as RpContextResponse;
}

async function verifyProof(
  apiBaseUrl: string,
  proofResult: unknown,
): Promise<VerificationResponse> {
  const response = await fetch(`${apiBaseUrl}/api/worldid/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(proofResult),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "World proof verification failed.");
  }

  return json as VerificationResponse;
}

function getIdKitFailureMessage(completion: IdKitCompletionFailure): string {
  if (completion.error === "credential_unavailable") {
    return "This World account does not have the required Orb credential. This demo currently requests an Orb-only proof, so you need a World account that has already completed Orb verification.";
  }

  if (completion.error) {
    return `World verification was not completed: ${completion.error}`;
  }

  return "World verification was not completed.";
}

async function runWorldFlow() {
  const config = window.__HUMANLY_WEB_CONFIG__;

  if (!config) {
    throw new Error("Missing browser config.");
  }

  const signalInput = requireElement<HTMLInputElement>("[data-signal-input]");
  const signal = signalInput.value.trim() || undefined;
  clearConnectorUi();

  setStatus("Requesting RP context from the API...");
  const rpContext = await requestRpContext(
    config.apiBaseUrl,
    config.worldAction,
    signal,
  );
  setJsonOutput("RP Context", rpContext);

  setStatus("Opening World IDKit flow...");
  const builder = IDKit.request({
    app_id: rpContext.app_id,
    action: rpContext.action,
    rp_context: rpContext.rp_context,
    allow_legacy_proofs: true,
    environment: "production",
  });

  const request = await (signal
    ? builder.preset(orbLegacy({ signal }))
    : builder.preset(orbLegacy()));

  await renderConnectorUi(request.connectorURI);
  setStatus("Waiting for the World App / Orb flow to complete...");
  const completion = (await request.pollUntilCompletion()) as IdKitCompletion;
  setJsonOutput("IDKit Result", completion);

  if (!completion.success) {
    throw new Error(getIdKitFailureMessage(completion));
  }

  setStatus("Verifying proof with the API...");
  const verificationResult = await verifyProof(
    config.apiBaseUrl,
    completion.result,
  );
  setJsonOutput("Verification Result", verificationResult);
  setStatus("World verification succeeded.", "success");
}

function attachHandlers() {
  const verifyButton = requireElement<HTMLButtonElement>("[data-verify-button]");

  verifyButton.addEventListener("click", async () => {
    verifyButton.disabled = true;
    setStatus("Starting World verification...");

    try {
      await runWorldFlow();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "World verification failed.";
      setStatus(message, "error");
    } finally {
      verifyButton.disabled = false;
    }
  });
}

attachHandlers();
