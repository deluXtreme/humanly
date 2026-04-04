# circle

Reusable Circle/CCTP utilities for the Humanly app layer.

## Public API

```bash
bun run check
```

```bash
bun test
```

## Exports

- CCTP transaction helpers from `src/cctp.ts`
- chain/domain metadata from `src/data.ts`
- IRIS URL and attestation helpers from `src/iris-types.ts`
- ERC-20 approval helper from `src/erc20.ts`

## Non-CRE Client Helpers

The async IRIS fetch helpers live behind the `circle/client` subpath so the
root package stays compatible with CRE workflow compilation.

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
