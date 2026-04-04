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
  width: min(1520px, calc(100vw - 72px));
  margin: 0 auto;
  padding: 48px 0 72px;
}

.hero {
  margin-bottom: 28px;
  max-width: 1180px;
}

.hero--split {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(260px, 360px);
  gap: 28px;
  align-items: end;
}

.hero-copy {
  min-width: 0;
}

.hero-art {
  position: relative;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.42)),
    linear-gradient(180deg, rgba(255, 250, 241, 0.9), rgba(234, 244, 239, 0.82));
  box-shadow: 0 18px 60px rgba(24, 33, 31, 0.08);
  overflow: hidden;
}

.hero-art::after {
  content: "";
  position: absolute;
  inset: auto -16% -28% auto;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(10, 124, 102, 0.14), transparent 68%);
}

.hero-art svg {
  display: block;
  width: 100%;
  height: auto;
}

.hero-caption {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
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
  max-width: 72ch;
  font-size: 18px;
  line-height: 1.6;
  color: var(--muted);
}

.lede a,
.subtle a {
  color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(380px, 0.95fr);
  gap: 28px;
  align-items: start;
}

.card {
  padding: 28px;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  gap: 24px;
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

.miner-check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 12px;
}

.miner-check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.56);
}

.miner-check input {
  margin-top: 2px;
}

.miner-check strong {
  display: block;
  font-size: 14px;
}

.miner-check span {
  display: block;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.56);
}

.stat-card p {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stat-card code {
  display: block;
  word-break: break-all;
}

.copy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.copy-row button {
  padding: 10px 14px;
}

@media (max-width: 820px) {
  main {
    width: min(100vw - 24px, 720px);
    padding: 32px 0 48px;
  }

  .hero--split {
    grid-template-columns: 1fr;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .miner-check-grid,
  .stat-grid,
  .field-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1360px) {
  .grid {
    grid-template-columns: minmax(0, 1.72fr) minmax(400px, 0.92fr);
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
          prepares the future Humanly contract payload. Need a Uniswap v4 hook
          salt for a future pool? Use the <a href="/hook-miner">hook salt miner</a>.
        </p>
      </section>

      <section class="grid">
        <section class="stack">
          <article class="card">
            <h2><span class="step">1</span>Connect Wallet</h2>
            <p class="subtle">
              The connected wallet becomes the creator signal for World ID and
              the future auction owner in the Humanly contract flow.
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
              the signal and verified by the local API before becoming part of the
              future contract payload.
            </p>
            <div class="actions">
              <button type="button" data-verify-button>Verify with World ID</button>
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

function renderHookPermissionCheckbox(
  permission: string,
  description: string,
): string {
  return `<label class="miner-check">
    <input type="checkbox" data-miner-input data-hook-permission="${escapeHtml(permission)}" />
    <span>
      <strong>${escapeHtml(permission)}</strong>
      <span>${escapeHtml(description)}</span>
    </span>
  </label>`;
}

export function renderHookMinerHtml(): string {
  const permissionCheckboxes = ([
    ["beforeInitialize", "Run before the hook initializes the pool."],
    ["afterInitialize", "Run after pool initialization completes."],
    ["beforeAddLiquidity", "Intercept liquidity additions before execution."],
    ["afterAddLiquidity", "Run after liquidity has been added."],
    ["beforeRemoveLiquidity", "Intercept liquidity removal before execution."],
    ["afterRemoveLiquidity", "Run after liquidity has been removed."],
    ["beforeSwap", "Run before swaps enter the pool manager."],
    ["afterSwap", "Run after swaps execute."],
    ["beforeDonate", "Intercept donation flows before execution."],
    ["afterDonate", "Run after donations execute."],
    ["beforeSwapReturnDelta", "Return custom deltas before swap settlement."],
    ["afterSwapReturnDelta", "Return custom deltas after swap settlement."],
    ["afterAddLiquidityReturnDelta", "Return deltas after adding liquidity."],
    ["afterRemoveLiquidityReturnDelta", "Return deltas after removing liquidity."],
  ] as const)
    .map(([permission, description]) =>
      renderHookPermissionCheckbox(permission, description),
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Humanly Salt Miner</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <section class="hero hero--split">
        <div class="hero-copy">
          <p class="eyebrow">Humanly / Hook Salt Miner</p>
          <h1>Salt Miner</h1>
          <p class="lede">
            Dig through the search space for a Uniswap v4 hook address that
            lands on the right permission mask. The Rust wasm miner runs in
            browser workers while Cloudflare just serves the tools. Return to the
            <a href="/">launch studio</a> when you strike salt.
          </p>
        </div>
        <figure class="hero-art" aria-hidden="true">
          <svg viewBox="0 0 420 320" role="presentation">
            <defs>
              <linearGradient id="salt-ground" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stop-color="#efe6d2" />
                <stop offset="100%" stop-color="#d7e6df" />
              </linearGradient>
              <linearGradient id="salt-crystal" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stop-color="#fefcf7" />
                <stop offset="100%" stop-color="#9fd7cb" />
              </linearGradient>
            </defs>
            <rect x="0" y="210" width="420" height="110" rx="34" fill="url(#salt-ground)" />
            <ellipse cx="290" cy="232" rx="86" ry="26" fill="#f8f4ea" />
            <ellipse cx="118" cy="244" rx="70" ry="22" fill="#ece1cb" />
            <polygon points="282,88 314,158 250,158" fill="url(#salt-crystal)" stroke="#18211f" stroke-opacity="0.16" />
            <polygon points="334,104 356,154 312,154" fill="#d7f2ec" stroke="#18211f" stroke-opacity="0.12" />
            <polygon points="242,118 258,150 226,150" fill="#fefaf0" stroke="#18211f" stroke-opacity="0.12" />
            <ellipse cx="156" cy="208" rx="32" ry="36" fill="#18211f" fill-opacity="0.08" />
            <circle cx="150" cy="120" r="28" fill="#e5b083" />
            <path d="M122 162c8-18 50-18 58 0v54h-58z" fill="#0a7c66" />
            <path d="M136 170h16v68h-16z" fill="#f6f2e8" fill-opacity="0.55" />
            <path d="M180 172c20-6 46 6 56 26" fill="none" stroke="#18211f" stroke-width="14" stroke-linecap="round" />
            <path d="M112 172c-18 4-32 18-36 40" fill="none" stroke="#18211f" stroke-width="14" stroke-linecap="round" />
            <path d="M214 94l58 82" fill="none" stroke="#7d5a34" stroke-width="10" stroke-linecap="round" />
            <path d="M198 110l86-34" fill="none" stroke="#7d5a34" stroke-width="10" stroke-linecap="round" />
            <path d="M186 112l36 12" fill="none" stroke="#18211f" stroke-width="9" stroke-linecap="round" />
            <path d="M274 64l18 28" fill="none" stroke="#18211f" stroke-width="8" stroke-linecap="round" />
            <path d="M282 72l-10 24" fill="none" stroke="#18211f" stroke-width="8" stroke-linecap="round" />
            <path d="M70 238c28-10 56-10 84 0" fill="none" stroke="#cdbb99" stroke-width="14" stroke-linecap="round" />
            <circle cx="144" cy="114" r="4" fill="#18211f" />
            <circle cx="160" cy="114" r="4" fill="#18211f" />
            <path d="M142 128c8 8 18 8 26 0" fill="none" stroke="#18211f" stroke-width="4" stroke-linecap="round" />
          </svg>
          <figcaption class="hero-caption">
            Tiny prospector, oversized ambition, hopefully immaculate hook bits.
          </figcaption>
        </figure>
      </section>

      <section class="grid">
        <section class="stack">
          <article class="card">
            <h2><span class="step">1</span>Configure Miner</h2>
            <p class="subtle">
              Provide the hook deployer, the init code hash, the permission bits,
              and an optional vanity prefix. The worker will search for a CREATE2
              salt whose deployed address ends with the required Uniswap v4 hook
              permission mask.
            </p>

            <section class="fieldset">
              <div class="field-grid">
                <div class="field">
                  <label for="miner-deployer-address">Deployer Address</label>
                  <input id="miner-deployer-address" data-miner-input data-deployer-address-input />
                </div>
                <div class="field">
                  <label for="miner-init-code-hash">Init Code Hash</label>
                  <input
                    id="miner-init-code-hash"
                    data-miner-input
                    data-init-code-hash-input
                    placeholder="0x..."
                  />
                </div>
                <div class="field">
                  <label for="miner-vanity-prefix">Vanity Prefix</label>
                  <input
                    id="miner-vanity-prefix"
                    data-miner-input
                    data-vanity-prefix-input
                    placeholder="optional hex prefix"
                  />
                </div>
                <div class="field">
                  <label for="miner-thread-count">Threads</label>
                  <input
                    id="miner-thread-count"
                    type="number"
                    min="1"
                    max="32"
                    data-miner-input
                    data-thread-input
                  />
                </div>
              </div>

              <div class="actions">
                <label class="miner-check">
                  <input type="checkbox" data-miner-input data-case-sensitive-input />
                  <span>
                    <strong>Case Sensitive Prefix</strong>
                    <span>Match vanity casing exactly instead of lowercasing it.</span>
                  </span>
                </label>
              </div>
            </section>

            <section class="fieldset">
              <h3>Hook Permissions</h3>
              <div class="miner-check-grid">
                ${permissionCheckboxes}
              </div>
            </section>

            <div class="actions">
              <button type="button" data-start-button>Start mining</button>
              <button type="button" data-stop-button>Stop</button>
            </div>

            <div class="status" data-status data-kind="idle">
              Ready to mine a Uniswap v4 hook salt.
            </div>
          </article>
        </section>

        <article class="card">
          <p class="output-label" data-output-label>Hook Miner Draft</p>
          <p class="subtle">
            The right column keeps the derived hook mask, selected permission set,
            and the current mining result together.
          </p>

          <section class="stat-grid">
            <div class="stat-card">
              <p>Hook Mask</p>
              <code data-mask-value>0x0000000000000000000000000000000000000000</code>
            </div>
            <div class="stat-card">
              <p>Permissions</p>
              <code data-permissions-value>none selected</code>
            </div>
            <div class="stat-card">
              <p>Mined Salt</p>
              <code data-salt-value>not mined yet</code>
            </div>
            <div class="stat-card">
              <p>Hook Address</p>
              <code data-address-value>not mined yet</code>
            </div>
          </section>

          <div class="copy-row">
            <button type="button" data-copy-salt-button>Copy salt</button>
            <button type="button" data-copy-address-button>Copy address</button>
          </div>

          <pre data-output>{
  "status": "loading-hook-miner"
}</pre>
        </article>
      </section>
    </main>
    <script type="module" src="/hook-miner.js"></script>
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

export async function buildHookMinerBundle(): Promise<string> {
  const minerEntrypoint = new URL("./hook-miner.ts", import.meta.url).pathname;

  const result = await Bun.build({
    entrypoints: [minerEntrypoint],
    target: "browser",
    format: "esm",
    minify: false,
    sourcemap: "inline",
  });

  if (!result.success || result.outputs.length === 0) {
    const logs = result.logs
      .map((log: { message: string }) => log.message)
      .join("\n");
    throw new Error(`Failed to build hook miner bundle.\n${logs}`);
  }

  const output = result.outputs[0];

  if (!output) {
    throw new Error("Bun.build returned no hook miner bundle output.");
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

export function loadHookMinerWorkerFile(): Bun.BunFile {
  return Bun.file(new URL("./hook-miner-worker.js", import.meta.url));
}

export function loadHookMinerModuleFile(): Bun.BunFile {
  return Bun.file(
    new URL("./vendor/hook-miner/miner_wasm_worker.js", import.meta.url),
  );
}

export function loadHookMinerWasmFile(): Bun.BunFile {
  return Bun.file(
    new URL("./vendor/hook-miner/miner_wasm_worker_bg.wasm", import.meta.url),
  );
}

let clientBundlePromise: Promise<string> | undefined;
let idKitWasmFilePromise: Promise<Bun.BunFile> | undefined;
let hookMinerBundlePromise: Promise<string> | undefined;

export interface WebFetchAssets {
  clientBundle?: string;
  hookMinerBundle?: string;
  wasmBody?: BodyInit;
  hookMinerWorkerBody?: BodyInit;
  hookMinerModuleBody?: BodyInit;
  hookMinerWasmBody?: BodyInit;
}

function getClientBundle(): Promise<string> {
  clientBundlePromise ??= buildClientBundle();
  return clientBundlePromise;
}

function getIdKitWasmFile(): Promise<Bun.BunFile> {
  idKitWasmFilePromise ??= loadIdKitWasmFile();
  return idKitWasmFilePromise;
}

function getHookMinerBundle(): Promise<string> {
  hookMinerBundlePromise ??= buildHookMinerBundle();
  return hookMinerBundlePromise;
}

export async function createWebFetchHandler(
  config: WebConfig,
  assets: WebFetchAssets = {},
) {
  const [
    clientBundle,
    hookMinerBundle,
    wasmFile,
    hookMinerWorkerFile,
    hookMinerModuleFile,
    hookMinerWasmFile,
  ] = await Promise.all([
    assets.clientBundle ?? getClientBundle(),
    assets.hookMinerBundle ?? getHookMinerBundle(),
    assets.wasmBody ?? getIdKitWasmFile(),
    assets.hookMinerWorkerBody ?? loadHookMinerWorkerFile(),
    assets.hookMinerModuleBody ?? loadHookMinerModuleFile(),
    assets.hookMinerWasmBody ?? loadHookMinerWasmFile(),
  ]);
  const browserConfig = {
    apiBaseUrl: config.apiBaseUrl,
    worldAction: config.worldAction,
    previewAddresses: config.previewAddresses,
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

    if (url.pathname === "/hook-miner" || url.pathname === "/hook-miner.html") {
      return new Response(renderHookMinerHtml(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/hook-miner.js") {
      return new Response(hookMinerBundle, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/hook-miner-worker.js") {
      return new Response(hookMinerWorkerFile, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/vendor/hook-miner/miner_wasm_worker.js") {
      return new Response(hookMinerModuleFile, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
        },
      });
    }

    if (url.pathname === "/vendor/hook-miner/miner_wasm_worker_bg.wasm") {
      return new Response(hookMinerWasmFile, {
        headers: {
          "content-type": "application/wasm",
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
