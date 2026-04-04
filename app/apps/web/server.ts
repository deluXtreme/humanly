import { createWebConfig } from "./config.ts";
import type { WebConfig, WebEnv } from "./types.ts";
import {
  createDefaultHumanlyFullRangeLaunchInput,
  HUMANLY_ALLOWED_POOL_LP_FEES,
  HUMANLY_ALLOWED_POOL_TICK_SPACINGS,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
} from "uniswap";

export const STYLES = `
:root {
  color-scheme: light;
  --bg: #f6f2e8;
  --panel: rgba(255, 252, 244, 0.88);
  --ink: #18211f;
  --muted: #57615d;
  --accent: #0a7c66;
  --accent-ink: #effbf7;
  --line: rgba(24, 33, 31, 0.12);
  --error: #b13a1d;
  --success: #0f7b42;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: Georgia, "Times New Roman", serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(10, 124, 102, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(230, 154, 77, 0.18), transparent 28%),
    var(--bg);
}

main {
  width: min(1080px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 48px 0 72px;
}

.hero {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 12px;
  color: var(--muted);
}

h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(40px, 8vw, 82px);
  line-height: 0.94;
  font-weight: 600;
}

.lede {
  max-width: 62ch;
  font-size: 18px;
  line-height: 1.6;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
  align-items: start;
}

.card {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 60px rgba(24, 33, 31, 0.08);
}

.card h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 24px;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.field label {
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.field input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  font: inherit;
}

.field textarea,
.field select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  font: inherit;
}

.field textarea {
  min-height: 108px;
  resize: vertical;
}

.fieldset {
  margin: 0 0 18px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-grid .field {
  margin-bottom: 0;
}

.step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(10, 124, 102, 0.12);
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  margin-right: 10px;
}

button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 14px 20px;
  background: var(--accent);
  color: var(--accent-ink);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.status {
  margin-top: 16px;
  min-height: 24px;
  color: var(--muted);
}

.status[data-kind="error"] { color: var(--error); }
.status[data-kind="success"] { color: var(--success); }

.connector {
  display: inline-block;
  margin-top: 12px;
  color: var(--accent);
}

.connector-panel {
  margin-top: 18px;
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 24px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.7);
  overflow: visible;
}

.connector-panel[hidden] {
  display: none;
}

.connector-panel p {
  margin: 0;
  max-width: 32ch;
  text-align: center;
  color: var(--muted);
  line-height: 1.5;
}

.connector-qr {
  display: block;
  width: min(100%, 380px);
  max-width: 380px;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 18px;
  background: #fffaf0;
  border: 1px solid var(--line);
  image-rendering: pixelated;
}

pre {
  margin: 0;
  max-height: 420px;
  overflow: auto;
  padding: 16px;
  border-radius: 18px;
  background: rgba(24, 33, 31, 0.92);
  color: #f6f2e8;
  font-size: 13px;
  line-height: 1.5;
}

.output-label {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.subtle {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.6;
}

.stack {
  display: grid;
  gap: 20px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.wallet-summary,
.validation-summary {
  color: var(--muted);
  line-height: 1.6;
}

@media (max-width: 820px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }
}
`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderIndexHtml(): string {
  const defaults = createDefaultHumanlyFullRangeLaunchInput();
  const networkOptions = Object.entries(HUMANLY_SUPPORTED_LAUNCH_NETWORKS)
    .map(
      ([networkKey, network]) =>
        `<option value="${escapeHtml(networkKey)}"${
          networkKey === defaults.network ? " selected" : ""
        }>${escapeHtml(network.name)}</option>`,
    )
    .join("");
  const lpFeeOptions = HUMANLY_ALLOWED_POOL_LP_FEES.map(
    (fee) =>
      `<option value="${fee}"${
        fee === defaults.liquidity.poolLpFee ? " selected" : ""
      }>${fee}</option>`,
  ).join("");
  const tickSpacingOptions = HUMANLY_ALLOWED_POOL_TICK_SPACINGS.map(
    (spacing) =>
      `<option value="${spacing}"${
        spacing === defaults.liquidity.poolTickSpacing ? " selected" : ""
      }>${spacing}</option>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Humanly Launch Studio</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">Humanly / Launch Studio</p>
        <h1>Create a human-gated Uniswap launch.</h1>
        <p class="lede">
          This local development flow connects a wallet, configures a constrained
          Uniswap Liquidity Launcher auction, collects a World ID proof, and
          submits the merged <code>HumanlyCCA.verifyAndExecute</code> payload on Base.
        </p>
      </section>

      <section class="grid">
        <section class="stack">
          <article class="card">
            <h2><span class="step">1</span>Connect Wallet</h2>
            <p class="subtle">
              The connected wallet becomes the creator and is bound into the
              HumanlyCCA signal hash together with the exact launch payload.
            </p>
            <div class="actions">
              <button type="button" data-connect-button>Connect wallet</button>
            </div>
            <p class="wallet-summary" data-wallet-summary>No wallet connected.</p>
          </article>

          <article class="card">
            <h2><span class="step">2</span>Configure Launch</h2>
            <p class="subtle">
              This UI intentionally exposes a narrower surface than raw
              Uniswap launcher contracts: <code>UERC20</code> +
              <code>FullRangeLBPStrategy</code> + USDC + generated CCA
              schedules.
            </p>

            <section class="fieldset">
              <div class="field">
                <label for="network">Network</label>
                <select id="network" data-network-input data-launch-input>
                  ${networkOptions}
                </select>
              </div>
            </section>

            <section class="fieldset">
              <h3>Token</h3>
              <div class="field-grid">
                <div class="field">
                  <label for="token-name">Name</label>
                  <input id="token-name" data-token-name-input data-launch-input />
                </div>
                <div class="field">
                  <label for="token-symbol">Symbol</label>
                  <input id="token-symbol" data-token-symbol-input data-launch-input />
                </div>
                <div class="field">
                  <label for="token-supply">Initial Supply</label>
                  <input id="token-supply" data-token-supply-input data-launch-input />
                </div>
                <div class="field">
                  <label for="token-website">Website</label>
                  <input id="token-website" data-token-website-input data-launch-input />
                </div>
                <div class="field" style="grid-column: 1 / -1;">
                  <label for="token-description">Description</label>
                  <textarea id="token-description" data-token-description-input data-launch-input></textarea>
                </div>
                <div class="field" style="grid-column: 1 / -1;">
                  <label for="token-image">Image URL</label>
                  <input id="token-image" data-token-image-input data-launch-input />
                </div>
              </div>
            </section>

            <section class="fieldset">
              <h3>Auction</h3>
              <div class="field-grid">
                <div class="field">
                  <label for="start-delay">Start Delay Blocks</label>
                  <input id="start-delay" type="number" min="1" data-start-delay-input data-launch-input />
                </div>
                <div class="field">
                  <label for="prebid-blocks">Prebid Blocks</label>
                  <input id="prebid-blocks" type="number" min="0" data-prebid-blocks-input data-launch-input />
                </div>
                <div class="field">
                  <label for="auction-blocks">Auction Blocks</label>
                  <input id="auction-blocks" type="number" min="1" data-auction-blocks-input data-launch-input />
                </div>
                <div class="field">
                  <label for="migration-delay">Migration Delay Blocks</label>
                  <input id="migration-delay" type="number" min="1" data-migration-delay-input data-launch-input />
                </div>
                <div class="field">
                  <label for="sweep-delay">Sweep Delay Blocks</label>
                  <input id="sweep-delay" type="number" min="1" data-sweep-delay-input data-launch-input />
                </div>
                <div class="field">
                  <label for="required-raised">Required USDC Raised</label>
                  <input id="required-raised" data-required-raised-input data-launch-input />
                </div>
                <div class="field">
                  <label for="floor-price">Floor Price (USDC per token)</label>
                  <input id="floor-price" data-floor-price-input data-launch-input />
                </div>
                <div class="field">
                  <label for="tick-size">Tick Size (USDC per token)</label>
                  <input id="tick-size" data-tick-size-input data-launch-input />
                </div>
              </div>
            </section>

            <section class="fieldset">
              <h3>Liquidity</h3>
              <div class="field-grid">
                <div class="field">
                  <label for="auction-token-percentage">Auction Token Percentage</label>
                  <input
                    id="auction-token-percentage"
                    type="number"
                    min="1"
                    max="99"
                    step="0.1"
                    data-auction-token-percentage-input
                    data-launch-input
                  />
                </div>
                <div class="field">
                  <label for="pool-lp-fee">Pool LP Fee</label>
                  <select id="pool-lp-fee" data-pool-lp-fee-input data-launch-input>
                    ${lpFeeOptions}
                  </select>
                </div>
                <div class="field">
                  <label for="pool-tick-spacing">Pool Tick Spacing</label>
                  <select id="pool-tick-spacing" data-pool-tick-spacing-input data-launch-input>
                    ${tickSpacingOptions}
                  </select>
                </div>
                <div class="field">
                  <label for="max-usdc-for-lp">Max USDC For LP (optional)</label>
                  <input id="max-usdc-for-lp" data-max-usdc-for-lp-input data-launch-input />
                </div>
              </div>
            </section>

            <p class="validation-summary" data-validation-summary>
              Waiting for launch parameters.
            </p>

            <div class="actions">
              <button type="button" data-preview-button>Build launch preview</button>
            </div>
          </article>

          <article class="card">
            <h2><span class="step">3</span>Proof Of Human</h2>
            <p class="subtle">
              The World proof is requested with the connected wallet address as
              a contract-bound launch signal and verified by the local API before
              being submitted to <code>verifyAndExecute</code>.
            </p>
            <div class="actions">
              <button type="button" data-verify-button>Verify with World ID</button>
              <button type="button" data-submit-button>Create auction onchain</button>
            </div>
            <div class="status" data-status data-kind="idle">
              Waiting to start.
            </div>
            <section class="connector-panel" data-connector-panel hidden>
              <p>Scan this QR code with the World App on your phone.</p>
              <img
                class="connector-qr"
                data-connector-qr
                alt="World ID connector QR code"
              />
            </section>
            <a
              class="connector"
              data-connector
              hidden
              target="_blank"
              rel="noreferrer"
            >
              Open connector URL
            </a>
          </article>
        </section>

        <article class="card">
          <p class="output-label" data-output-label>Output</p>
          <pre data-output>{
  "status": "loading-browser-config"
}</pre>
        </article>
      </section>
    </main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}

export async function buildClientBundle(): Promise<string> {
  const clientEntrypoint = new URL("./client.ts", import.meta.url).pathname;

  const result = await Bun.build({
    entrypoints: [clientEntrypoint],
    target: "browser",
    format: "esm",
    minify: false,
    sourcemap: "inline",
  });

  if (!result.success || result.outputs.length === 0) {
    const logs = result.logs
      .map((log: { message: string }) => log.message)
      .join("\n");
    throw new Error(`Failed to build web client bundle.\n${logs}`);
  }

  const output = result.outputs[0];

  if (!output) {
    throw new Error("Bun.build returned no browser bundle output.");
  }

  return await output.text();
}

export async function loadIdKitWasmFile(): Promise<Bun.BunFile> {
  const idKitEntryUrl = await import.meta.resolve("@worldcoin/idkit-core");
  const wasmUrl = new URL("idkit_wasm_bg.wasm", idKitEntryUrl);
  const wasmFile = Bun.file(wasmUrl);

  if (!(await wasmFile.exists())) {
    throw new Error(`Unable to find World IDKit WASM asset at ${wasmUrl}.`);
  }

  return wasmFile;
}

let clientBundlePromise: Promise<string> | undefined;
let idKitWasmFilePromise: Promise<Bun.BunFile> | undefined;

function getClientBundle(): Promise<string> {
  clientBundlePromise ??= buildClientBundle();
  return clientBundlePromise;
}

function getIdKitWasmFile(): Promise<Bun.BunFile> {
  idKitWasmFilePromise ??= loadIdKitWasmFile();
  return idKitWasmFilePromise;
}

export async function createWebFetchHandler(config: WebConfig) {
  const clientBundle = await getClientBundle();
  const wasmFile = await getIdKitWasmFile();
  const browserConfig = {
    apiBaseUrl: config.apiBaseUrl,
    worldAction: config.worldAction,
    worldRpId: config.worldRpId,
    previewAddresses: config.previewAddresses,
    humanlyCcaAddress: config.humanlyCcaAddress,
  };

  return function fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(renderIndexHtml(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/client.js") {
      return new Response(clientBundle, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/idkit_wasm_bg.wasm") {
      return new Response(wasmFile, {
        headers: {
          "content-type": "application/wasm",
        },
      });
    }

    if (url.pathname === "/styles.css") {
      return new Response(STYLES, {
        headers: {
          "content-type": "text/css; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/config.json") {
      return Response.json(browserConfig, {
        headers: {
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        service: "humanly-web",
      });
    }

    return new Response("Not found", { status: 404 });
  };
}

export async function startWebServer() {
  const config = createWebConfig(process.env as WebEnv);
  const fetch = await createWebFetchHandler(config);

  const server = Bun.serve({
    port: config.port,
    hostname: config.host,
    fetch,
  });

  console.log(`Humanly Web listening on http://${server.hostname}:${server.port}`);

  return server;
}

if (import.meta.main) {
  await startWebServer();
}
