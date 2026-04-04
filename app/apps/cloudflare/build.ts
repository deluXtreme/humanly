import { mkdir } from "node:fs/promises";

import {
  buildClientBundle,
  buildHookMinerBundle,
  loadIdKitWasmFile,
  loadHookMinerModuleFile,
  loadHookMinerWasmFile,
  loadHookMinerWorkerFile,
  renderHookMinerHtml,
  renderIndexHtml,
  STYLES,
} from "../web/server.ts";

const OUTPUT_DIR = new URL("./public/", import.meta.url);

async function buildStaticAssets() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(new URL("./vendor/hook-miner/", OUTPUT_DIR), { recursive: true });

  const [
    clientBundle,
    hookMinerBundle,
    wasmFile,
    hookMinerWorkerFile,
    hookMinerModuleFile,
    hookMinerWasmFile,
  ] = await Promise.all([
    buildClientBundle(),
    buildHookMinerBundle(),
    loadIdKitWasmFile(),
    loadHookMinerWorkerFile(),
    loadHookMinerModuleFile(),
    loadHookMinerWasmFile(),
  ]);

  await Promise.all([
    Bun.write(new URL("./index.html", OUTPUT_DIR), renderIndexHtml()),
    Bun.write(new URL("./hook-miner.html", OUTPUT_DIR), renderHookMinerHtml()),
    Bun.write(new URL("./styles.css", OUTPUT_DIR), STYLES),
    Bun.write(new URL("./client.js", OUTPUT_DIR), clientBundle),
    Bun.write(new URL("./hook-miner.js", OUTPUT_DIR), hookMinerBundle),
    Bun.write(new URL("./hook-miner-worker.js", OUTPUT_DIR), hookMinerWorkerFile),
    Bun.write(new URL("./idkit_wasm_bg.wasm", OUTPUT_DIR), wasmFile),
    Bun.write(
      new URL("./vendor/hook-miner/miner_wasm_worker.js", OUTPUT_DIR),
      hookMinerModuleFile,
    ),
    Bun.write(
      new URL("./vendor/hook-miner/miner_wasm_worker_bg.wasm", OUTPUT_DIR),
      hookMinerWasmFile,
    ),
  ]);

  console.log(`Built Cloudflare web assets into ${OUTPUT_DIR.pathname}`);
}

if (import.meta.main) {
  await buildStaticAssets();
}

export { buildStaticAssets };
