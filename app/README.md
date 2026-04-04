# humanly/app

Bun workspace for the Humanly application layer.

## Structure

- `packages/*`: reusable libraries such as `world`, `circle`, and `uniswap`
- `apps/*`: deployable entrypoints such as `api`

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
