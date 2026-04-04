# world

Reusable World ID scaffolding for the `humanly` workspace.

This package is intentionally framework-agnostic. It gives the app layer a
small set of helpers for the hybrid World ID strategy documented in
`cannes26/docs/05-worldid-integration.md`:

- build IDKit request objects for the frontend
- sign RP requests with `@worldcoin/idkit-server`
- build RP context objects from the server-side signing step
- verify proofs against World's `/api/v4/verify/{rp_id}` endpoint
- normalize legacy proof data for on-chain verification on Base
- expose the Base `WorldIDRouter` ABI and addresses for the Solidity wrapper

## Exports

- `createWorldRpContext(...)`
- `signWorldRpRequest(...)`
- `createSignedWorldRpContext(...)`
- `createHybridWorldIdRequest(...)`
- `createWorldVerifyRequestPayload(...)`
- `verifyWorldProof(...)`
- `createLegacyWorldIdVerificationInput(...)`
- `decodeLegacyWorldProof(...)`
- `BASE_WORLD_ID_ROUTER`
- `WORLD_ID_ROUTER_ABI`

## Example

```ts
import {
  createHybridWorldIdRequest,
  createSignedWorldRpContext,
  createWorldVerifyRequestPayload,
  verifyWorldProof,
} from "world";

const rpContext = await createSignedWorldRpContext({
  rpId: "rp_example",
  action: "create-auction",
  signingKeyHex: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
});

const idKitRequest = createHybridWorldIdRequest({
  appId: "app_example",
  action: "create-auction",
  signal: "0xCreatorWallet",
  rpContext,
});

const verifyPayload = createWorldVerifyRequestPayload({
  nonce: rpContext.nonce,
  action: "create-auction",
  responses: [],
});

await verifyWorldProof(verifyPayload, { rpId: "rp_example" });
```

## Notes

- This package standardizes on `@worldcoin/idkit-server` for RP signing. The
  wrapper is tolerant of both the current object-form `signRequest(...)` API
  and the older positional signature shown in some World examples.
- `createWorldRpContext(...)` is still exported for callers that already have a
  signature object and only need the request payload shape.
- HTTP handlers, env loading, and app runtime wiring should live outside this
  package in an app entrypoint such as `apps/api`.
- This package does not compute `signalHash` or `externalNullifierHash`. Those
  values should be computed in the contract integration layer using the exact
  hashing strategy required by the selected verifier path.
- The stable on-chain path here is the legacy Orb-only router path on Base.
- World ID 4.0 on-chain verification remains preview-only and should not be the
  MVP dependency.
