# Humanly

## Contract Deployment

Contracts are split into two separate Forge projects under `contracts/`:

- **`cctp/`** — `CCTPAuction` (Solidity 0.7.6) — Receives cross-chain USDC via CCTP and submits auction bids
- **`cre/`** — `CCTPAuctionWrapper` (Solidity 0.8.34) — CRE receiver that forwards reports to CCTPAuction

### Deployment Order

`CCTPAuction` must be deployed first. Its address is then used as a constructor argument for `CCTPAuctionWrapper`.

### Step 1: Deploy CCTPAuction

```bash
cd contracts/cctp
forge script script/Deploy.sol --rpc-url <rpc_alias> --private-key <DEPLOYER_KEY> --broadcast --verify
```

### Step 2: Deploy CCTPAuctionWrapper

Update `cre/script/Deploy.sol` with the deployed `CCTPAuction` address, then:

```bash
cd contracts/cre
forge script script/Deploy.sol --rpc-url <rpc_alias> --private-key <DEPLOYER_KEY> --broadcast --verify
```

### Supported Networks

| Network            | Chain ID | RPC Alias          |
| ------------------ | -------- | ------------------ |
| Base Mainnet       | 8453     | `base`             |
| Unichain Mainnet   | 130      | `unichain`         |
| Base Sepolia       | 84532    | `base_sepolia`     |
| Unichain Sepolia   | 1301     | `unichain_sepolia` |
