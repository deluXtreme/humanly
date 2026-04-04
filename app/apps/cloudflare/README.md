# cloudflare

Cloudflare Worker deployment target for Humanly.

This app packages:

- static web assets built from `apps/web`
- the World ID API router from `apps/api`
- x402-gated auction routes for agents
- a single Worker entrypoint that serves both

## Shape

- `/api/worldid/*` is handled by the Worker
- `/api/auctions/*` is handled by the Worker and can be gated with x402
- `/config.json` is handled by the Worker
- all other requests are served from static assets via `env.ASSETS.fetch()`

## Build

Generate the static frontend assets first:

```bash
bun run build:assets
```

This writes:

- `public/index.html`
- `public/styles.css`
- `public/client.js`
- `public/idkit_wasm_bg.wasm`

## Local dev

Wrangler uses `.dev.vars` for Worker bindings during local development. Keep this
separate from the Bun app env files.

Start from:

```bash
cp .dev.vars.example .dev.vars
```

Then fill in the real World/API values.

To enable x402 on the auction endpoints, also set:

```bash
X402_PAY_TO=0xYourWallet
X402_NETWORK=eip155:84532
X402_AUCTION_INFO_PRICE=$0.001
X402_AUCTION_ACTION_PRICE=$0.01
X402_FACILITATOR_URL=https://x402.org/facilitator
```

Run locally with:

```bash
bun run build:assets
bunx wrangler dev
```

## Deploy

After Wrangler is installed and Cloudflare auth is configured:

```bash
wrangler deploy
```

World secrets should be configured as Worker secrets / vars, not committed to
the repo.
