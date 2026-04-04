# humanly/app

Bun workspace for the Humanly application layer, including the web/api apps and CRE relay workflow entrypoints.

## Structure

- `packages/*`: reusable libraries such as `world`, `circle`, `relay-core`, and `uniswap`
- `apps/*`: deployable entrypoints such as `api`, `web`, and `submit-bid`
- `project.yaml` and `secrets.yaml`: CRE project-level configuration for workflow simulation and deployment
- `scripts/install-cre.sh`: helper for installing the CRE CLI

## Commands

```bash
bun install
```

```bash
bun test --filter world
```

```bash
bun test --filter api
```

```bash
bun test --filter web
```

```bash
bun test --filter relay-core
```

```bash
bun test --filter submit-bid
```

```bash
cre workflow simulate apps/submit-bid --target=staging-settings
```
