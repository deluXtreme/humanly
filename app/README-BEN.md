# README-BEN

This workspace now contains both the regular app code and the CRE relay code.

The goal is simple:
- keep reusable logic in `packages/*`
- keep runnable entrypoints in `apps/*`
- keep CRE project config at the `app/` root

## Current Layout

```text
app/
├── package.json
├── bun.lock
├── tsconfig.json
├── project.yaml
├── secrets.yaml
├── scripts/
│   └── install-cre.sh
├── packages/
│   ├── circle/
│   ├── relay-core/
│   ├── uniswap/
│   └── world/
└── apps/
    ├── api/
    ├── submit-bid/
    └── web/
```

## Boundaries

### `packages/circle`
Owns shared Circle/CCTP primitives.

Examples:
- chain + domain metadata
- IRIS helpers
- CCTP transaction builders
- bridge smoke-test script via `bun run arc`

If relay needs Circle data, it should come from `circle`, not from random local copies.

### `packages/relay-core`
Owns pure relay logic.

Examples:
- parsing `DepositForBurn`
- policy checks like destination caller matching
- calldata encoding for destination actions
- shared relay config types

This package should stay framework/runtime-agnostic. No CRE runner setup here.

### `apps/submit-bid`
Owns the CRE workflow entrypoint.

Examples:
- `Runner.newRunner(...)`
- CRE triggers and handlers
- fetching attestations inside CRE runtime
- wiring `circle` + `relay-core` together

If code is specific to CRE runtime behavior, it belongs here.

### `apps/api` and `apps/web`
Own the normal application runtime.

Examples:
- World ID backend endpoints
- World ID frontend
- regular Bun HTTP servers

Do not mix CRE workflow code into these apps.

### `project.yaml` and `secrets.yaml`
These are CRE project-level files.

They stay at `app/` root because they configure workflow simulation/deployment for CRE.

## Rules Going Forward

### 1. Do not recreate a standalone `relay/` workspace
All application-layer code now lives under `app/`.

### 2. Do not import package internals across boundaries
Good:
- `import { getChainByDomain } from "circle"`
- `import { parseDepositForBurnLog } from "relay-core"`

Bad:
- importing from another package's `src/*` path
- copying the same helper into multiple places

### 3. Keep secrets scoped to the owning package/app
Use package/app-local `.env` files, not one giant root `.env`.

Current examples:
- `apps/api/.env` for World ID backend secrets
- `packages/circle/.env` for bridge test keys used by `bun run arc`

Reason:
- smaller blast radius
- fewer accidental secret leaks
- easier to understand which runtime owns which variables

### 4. Do not commit generated CRE artifacts
Do not commit files like:
- `.cre_build_tmp.js`
- local temp bundles
- ad hoc generated output

### 5. Add tests where the logic lives
- package logic -> package tests
- app/runtime glue -> app tests

## Common Commands

From `app/`:

```bash
bun install
```

```bash
bun run arc
```

```bash
bun test --filter circle
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

## How To Add New Relay Work

### If it is reusable logic
Put it in `packages/relay-core`.

Examples:
- decoding another event
- shared bid instruction encoding
- filtering / routing rules

### If it is shared Circle/CCTP data or helpers
Put it in `packages/circle`.

Examples:
- new supported chain metadata
- new IRIS helper
- new CCTP utility

### If it is a CRE workflow
Put it in `apps/<workflow-name>`.

Examples:
- `apps/submit-bid`
- future `apps/finalize-bid`
- future `apps/refund-bid`

If a new workflow needs new root-level RPCs or secrets, update:
- `project.yaml`
- `secrets.yaml`

## If You Need To Change `submit-bid`

Typical flow:
1. update shared chain/config behavior in `packages/circle` or `packages/relay-core`
2. update runtime wiring in `apps/submit-bid`
3. update app config JSON if the workflow config shape changed
4. run package and app tests
5. run CRE simulation if the change is runtime-sensitive

## Short Version

- shared stuff -> `packages/*`
- runnable stuff -> `apps/*`
- CRE project config -> `app/` root
- secrets stay scoped
- do not reintroduce `relay/`
- do not import `src/*` across packages
