# api

Deployable API workspace for `humanly/app`.

This app owns runtime concerns that should not live in reusable packages:

- loading World env vars
- enforcing the allowed World action list
- exposing `/api/worldid/rp-context`
- exposing `/api/worldid/verify`
- exposing `/api/auctions/:chain/:auction`
- exposing `/api/auctions/:chain/:auction/preview-bid`
- exposing `/api/auctions/:chain/:auction/build-bid-tx`
- request routing and runtime integration

## Env

- `WORLD_APP_ID`
- `WORLD_RP_ID`
- `WORLD_RP_SIGNING_KEY`
- `WORLD_ALLOWED_ACTIONS`
- `WORLD_RP_TTL_SECONDS` (optional)
- `WORLD_VERIFY_API_BASE_URL` (optional)
- `PORT` (optional, defaults to `3010`)
- `HOST` (optional, defaults to `127.0.0.1`)

Copy `.env.example` to `.env` and fill in the real values.

For your current flow, keep:

```dotenv
WORLD_ALLOWED_ACTIONS=create-auction
```

## Example

```ts
import { createApiRouter, createApiWorldConfig } from "api";

const config = createApiWorldConfig(process.env);

export default {
  fetch: createApiRouter({ config }),
};
```

## Local Run

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in:

- `WORLD_APP_ID`
- `WORLD_RP_ID`
- `WORLD_RP_SIGNING_KEY`

Then start the API:

```bash
bun run --cwd apps/api dev
```

or

```bash
bun run --cwd apps/api start
```

The server exposes:

- `GET /healthz`
- `POST /api/worldid/rp-context`
- `POST /api/worldid/verify`
- `GET /api/auctions/:chain/:auction`
- `POST /api/auctions/:chain/:auction/preview-bid`
- `POST /api/auctions/:chain/:auction/build-bid-tx`

Auction participation support is currently narrow by design:

- supported chains: `base`, `base-sepolia`
- direct bid entrypoint only: `submitBid(uint256,uint128,address,uint256,bytes)`
- no hosted submission yet
- no cross-chain bidding yet
