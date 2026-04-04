import { mkdir } from "node:fs/promises";

import {
  buildClientBundle,
  loadIdKitWasmFile,
  renderIndexHtml,
  STYLES,
} from "../web/server.ts";

const OUTPUT_DIR = new URL("./public/", import.meta.url);

async function buildStaticAssets() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [clientBundle, wasmFile] = await Promise.all([
    buildClientBundle(),
    loadIdKitWasmFile(),
  ]);

  await Promise.all([
    Bun.write(new URL("./index.html", OUTPUT_DIR), renderIndexHtml()),
    Bun.write(new URL("./styles.css", OUTPUT_DIR), STYLES),
    Bun.write(new URL("./client.js", OUTPUT_DIR), clientBundle),
    Bun.write(new URL("./idkit_wasm_bg.wasm", OUTPUT_DIR), wasmFile),
  ]);

  console.log(`Built Cloudflare web assets into ${OUTPUT_DIR.pathname}`);
}

if (import.meta.main) {
  await buildStaticAssets();
}

export { buildStaticAssets };
