# web

Humanly launch-creation frontend for local development.

This app now:

- connects an injected wallet with `viem`
- collects a constrained Uniswap launch configuration
- builds a launch preview using `packages/uniswap`
- launches the World ID Orb compatibility flow
- verifies the returned proof with the API
- shows the current runtime state, launch preview, and World verification receipt

## Env

- `PORT` defaults to `3011`
- `HOST` defaults to `127.0.0.1`
- `API_BASE_URL` defaults to `http://127.0.0.1:3010`
- `WORLD_ACTION` defaults to `create-auction`
- `PREVIEW_LIQUIDITY_LAUNCHER_ADDRESS` overrides the local preview address book
- `PREVIEW_UERC20_FACTORY_ADDRESS` overrides the local preview address book
- `PREVIEW_FULL_RANGE_LBP_STRATEGY_FACTORY_ADDRESS` overrides the local preview address book
- `PREVIEW_CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS` overrides the local preview address book

Copy `.env.example` to `.env` if you want to override the defaults.

## Run

Start the API first:

```bash
bun run --cwd apps/api start
```

Then start the web app:

```bash
bun run --cwd apps/web dev
```

Open:

```text
http://127.0.0.1:3011
```

## Notes

- This app currently treats successful backend verification from World as the
  success condition for the launch demo.
- The app still stops at preview. It does not submit the final create-auction
  contract transaction.
- The launch preview uses the connected wallet as the creator and World signal.
- The preview address book can use placeholders locally until real deployment
  addresses are known.
