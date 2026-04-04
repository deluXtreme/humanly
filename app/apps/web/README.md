# web

Minimal World ID frontend for local Humanly development.

This app:

- requests `rp_context` from the API
- launches the World IDKit Orb compatibility flow
- sends the completed proof back to the API for verification

## Env

- `PORT` defaults to `3011`
- `HOST` defaults to `127.0.0.1`
- `API_BASE_URL` defaults to `http://127.0.0.1:3010`
- `WORLD_ACTION` defaults to `create-auction`

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
