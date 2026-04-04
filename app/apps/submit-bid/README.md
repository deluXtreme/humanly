# Hello World (TypeScript)

This CRE workflow listens for Circle `DepositForBurn` events and prepares the destination calldata for `mintAndSubmitBid`.

Steps to run the example

## 1. Update .env file

You need to add a private key to env file. This is specifically required if you want to simulate chain writes. For that to work the key should be valid and funded.
If your workflow does not do any chain write then you can just put any dummy key as a private key. e.g.

```
CRE_ETH_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
```

## 2. Install dependencies

```bash
bun install
```

## 3. Simulate the workflow
Run the command from <b>app workspace root</b>

```bash
cre workflow simulate apps/submit-bid --target=staging-settings
```

It is recommended to look into other existing examples to see how to write a workflow. You can generate them by running the `cre init` command.
