# Humanly

## Contract Deployment

Contracts are split into two separate Forge projects under `contracts/`:

- **`cctp/`** — `CCTPAuction` (Solidity 0.7.6) — Receives cross-chain USDC via CCTP and submits auction bids
- **`cre/`** — `CREAuctionWrapper` (Solidity 0.8.34) — CRE receiver that forwards reports to CCTPAuction

### Deployment Order

`CCTPAuction` must be deployed first. Its address is then used as a constructor argument for `CREAuctionWrapper`.

### Step 1: Deploy CCTPAuction

```bash
cd contracts/cctp
API_KEY_ETHERSCAN="" forge script script/Deploy.sol \
  --rpc-url <rpc_alias> --private-key <DEPLOYER_KEY> --broadcast \
  --verify --verifier blockscout --verifier-url <BLOCKSCOUT_API_URL>
```

### Step 2: Deploy CREAuctionWrapper

Update `cre/script/Deploy.sol` with the deployed `CCTPAuction` address, then:

```bash
cd contracts/cre
API_KEY_ETHERSCAN="" forge script script/Deploy.sol \
  --rpc-url <rpc_alias> --private-key <DEPLOYER_KEY> --broadcast \
  --verify --verifier blockscout --verifier-url <BLOCKSCOUT_API_URL>
```

### Verifying an Existing Deployment

If a contract was deployed without `--verify`, you can verify it after the fact:

```bash
forge verify-contract <CONTRACT_ADDRESS> src/<Contract>.sol:<Contract> \
  --rpc-url <rpc_alias> \
  --constructor-args $(cast abi-encode "constructor(...)" <args...>) \
  --verifier blockscout --verifier-url <EXPLORER_API_URL>
```

### Supported Networks

| Network            | Chain ID | RPC Alias          | Blockscout API URL                              |
| ------------------ | -------- | ------------------ | ------------------------------------------------ |
| Arc Testnet        | 5042002  | `arc_testnet`      | `https://testnet.arcscan.app/api/`               |
| Base Mainnet       | 8453     | `base`             | `https://base.blockscout.com/api/`               |
| Unichain Mainnet   | 130      | `unichain`         | `https://unichain.blockscout.com/api/`           |
| Base Sepolia       | 84532    | `base_sepolia`     | `https://base-sepolia.blockscout.com/api/`       |
| Unichain Sepolia   | 1301     | `unichain_sepolia` | `https://unichain-sepolia.blockscout.com/api/`   |

### Deployed Addresses

| Network          | CCTPAuction | CREAuctionWrapper |
| ---------------- | ----------- | ------------------ |
| Arc Testnet      | [`0x2CDf56BE53C9758D1B9f0Fc891B650e82BB64c52`](https://testnet.arcscan.app/address/0x2CDf56BE53C9758D1B9f0Fc891B650e82BB64c52) | [`0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55`](https://testnet.arcscan.app/address/0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55) |
| Unichain Sepolia | [`0xe10288AD9581c5954f2947e6B0FF136B5a942bbf`](https://unichain-sepolia.blockscout.com/address/0xe10288AD9581c5954f2947e6B0FF136B5a942bbf) | [`0x3aE495B2cB9E9E7EBaf00C215796D23fEE3c2aE4`](https://unichain-sepolia.blockscout.com/address/0x3aE495B2cB9E9E7EBaf00C215796D23fEE3c2aE4) |

