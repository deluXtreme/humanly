# uniswap

Shared Uniswap launcher helpers for the `humanly` app workspace.

Current scope:

- define the supported Humanly launch surface for v1
- keep human-facing launch inputs typed and validated
- avoid leaking raw launcher config into `apps/web`

The current supported product surface is intentionally narrower than the full
Uniswap Liquidity Launcher system:

- network-aware launcher configuration across a fixed supported set
- token factory: `UERC20`
- strategy: `FullRangeLBPStrategy`
- auction currency: `USDC`
- schedule mode: generated convex schedule with optional prebid period

Not user-configurable in the current surface:

- raw factory addresses
- arbitrary strategy selection
- arbitrary validation hooks
- raw `fundsRecipient` wiring
- arbitrary auction step bytes
- arbitrary network RPC wiring

Run checks:

```bash
bun run check
```

Run tests:

```bash
bun test
```
