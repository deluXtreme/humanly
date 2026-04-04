import { createWebConfig } from "./config.ts";
import type { WebConfig } from "./types.ts";

const STYLES = `
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

@media (max-width: 820px) {
  .grid {
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

function renderIndexHtml(config: Pick<WebConfig, "apiBaseUrl" | "worldAction">): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Humanly World ID</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">Humanly / World ID</p>
        <h1>Verify a human before creating an auction.</h1>
        <p class="lede">
          This local demo requests an RP context from your Bun API, launches the
          World IDKit flow for <code>${escapeHtml(config.worldAction)}</code>,
          and sends the proof back to your backend for verification.
        </p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>Start Verification</h2>
          <div class="field">
            <label for="signal">Signal (optional)</label>
            <input
              id="signal"
              data-signal-input
              placeholder="Wallet address or app-specific user id"
            />
          </div>
          <button type="button" data-verify-button>Verify with World ID</button>
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

        <article class="card">
          <p class="output-label" data-output-label>Output</p>
          <pre data-output>{
  "apiBaseUrl": "${escapeHtml(config.apiBaseUrl)}",
  "worldAction": "${escapeHtml(config.worldAction)}"
}</pre>
        </article>
      </section>
    </main>
    <script>
      window.__HUMANLY_WEB_CONFIG__ = ${JSON.stringify(config)};
    </script>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}

async function buildClientBundle(): Promise<string> {
  const result = await Bun.build({
    entrypoints: ["./client.ts"],
    target: "browser",
    format: "esm",
    minify: false,
    sourcemap: "inline",
  });

  if (!result.success || result.outputs.length === 0) {
    const logs = result.logs.map((log) => log.message).join("\n");
    throw new Error(`Failed to build web client bundle.\n${logs}`);
  }

  return await result.outputs[0].text();
}

async function loadIdKitWasmFile(): Promise<BunFile> {
  const idKitEntryUrl = await import.meta.resolve("@worldcoin/idkit-core");
  const wasmUrl = new URL("idkit_wasm_bg.wasm", idKitEntryUrl);
  const wasmFile = Bun.file(wasmUrl);

  if (!(await wasmFile.exists())) {
    throw new Error(`Unable to find World IDKit WASM asset at ${wasmUrl}.`);
  }

  return wasmFile;
}

export async function createWebFetchHandler(config: WebConfig) {
  const clientBundle = await buildClientBundle();
  const wasmFile = await loadIdKitWasmFile();

  return function fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(
        renderIndexHtml({
          apiBaseUrl: config.apiBaseUrl,
          worldAction: config.worldAction,
        }),
        {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        },
      );
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
  const config = createWebConfig(process.env);
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
