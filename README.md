# Humanly

## Architecture

Humanly is a sybil-resistant token launch platform. Issuers prove their humanity via **World ID** before launching a **Uniswap Continuous Clearing Auction (CCA)**. Participants can bid from **any chain with any token** — the **Uniswap API** handles the swap to USDC, which then flows cross-chain via **Circle CCTP** and is relayed to the auction by **Chainlink CRE**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LAUNCH (Token Issuer)                              │
│                                                                             │
│  Token Issuer                                                               │
│       │                                                                     │
│       │  World ID proof + token params                                      │
│       ▼                                                                     │
│  ┌──────────────┐    verify   ┌───────────────────┐                         │
│  │ HumanlyCCA   │────────────▶│ World ID Satellite│                         │
│  │ contracts/cca│             └───────────────────┘                         │
│  └──────┬───────┘                                                           │
│         │  createToken + distributeToken                                    │
│         ▼                                                                   │
│  ┌─────────────────────┐    launch   ┌──────────────┐                       │
│  │ Uniswap             │────────────▶│ Uniswap CCA  │◀─── bids land here    │
│  │ LiquidityLauncher   │             └──────────────┘                       │
│  └─────────────────────┘                    ▲                               │
└─────────────────────────────────────────────┼───────────────────────────────┘
                                              │
┌─────────────────────────────────────────────┼────────────────────────────────┐
│                     PARTICIPATE (Cross-Chain Bidder)                         │
│                                              │ submitBid                     │
│                                              │                               │
│  ┌─ Source Chain ──────────────────────┐     │  ┌─ Destination Chain (Base)─┐│
│  │                                     │     │  │                           ││
│  │  User / Bidder (any token)          │     │  │  ┌───────────────────┐    ││
│  │       │                             │     │  │  │ CREAuctionWrapper │    ││
│  │       │ swap via Uniswap API        │     │  │  │ contracts/cre     │    ││
│  │       ▼                             │     │  │  └────────┬──────────┘    ││
│  │  ┌──────────────┐                   │     │  │           │               ││
│  │  │ Uniswap API  │ any token → USDC  │     │  │           │ forward call  ││
│  │  └──────┬───────┘                   │     │  │           ▼               ││
│  │         │ burn USDC + hook data     │     │  │  ┌───────────────────┐    ││
│  │         ▼                           │     │  │  │ CCTPAuction       │    ││
│  │  ┌──────────────┐                   │     │  │  │ contracts/cctp    │──┘ ││
│  │  │ Circle CCTP  │                   │     │  │  └──┬─────────▲─────┘     ││
│  │  │ TokenMessngr │                   │     │  │     │         │           ││
│  │  └──────┬───────┘                   │     │  │     │receive  │mint USDC  ││
│  │         │ log event (DepositForBurn)│     │  │     │Message  │           ││
│  └─────────┼───────────────────────────┘     │  │     ▼         │           ││
│            │                                 │  │  ┌───────────────────┐    ││
│            ▼                                 │  │  │ Circle CCTP       │    ││
│  ┌─ Chainlink CRE ─────────────────────┐     │  │  │ MessageTransmttr  │    ││
│  │                                     │     │  │  └───────────────────┘    ││
│  │  CRE Workflow  (app/apps/submit-bid)│     │  │                           ││
│  │  log trigger ─▶ fetch attestation   │─────┘  │                           ││
│  │  from Iris API ─▶ deliver report    │deliver │                           ││
│  └─────────────────────────────────────┘report  │                           ││
│                                              │  │                           ││
│                                              │  └───────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Contracts

| Project | Contract | Solidity | Role |
|---------|----------|----------|------|
| `contracts/cca` | `HumanlyCCA` | 0.8.34 | Verifies World ID proof, creates token, launches CCA |
| `contracts/cctp` | `CCTPAuction` | 0.7.6 | Mints cross-chain USDC via CCTP, places auction bids |
| `contracts/cre` | `CREAuctionWrapper` | 0.8.34 | Chainlink CRE receiver, forwards reports to CCTPAuction |

### Services

| Service | Location | Description |
|---------|----------|-------------|
| **Submit Bid (CRE Workflow)** | `app/apps/submit-bid` | Chainlink CRE workflow with a log trigger watching `DepositForBurn` events on `TokenMessengerV2` per supported source chain. Filters for events where `destinationCaller` matches the `CCTPAuction` contract, fetches the CCTP message + attestation from Circle's Iris API, encodes the `mintAndSubmitBid` calldata, and delivers the report to `CREAuctionWrapper`. |
| **World ID Verification** | TBD | User-facing service that prompts token issuers to share their proof of humanity. Performs server-side validation and submits the World ID proof alongside the token launch parameters to `HumanlyCCA`. |

### Integrated Protocols

- **[Circle CCTP](https://developers.circle.com/stablecoins/cctp-getting-started)** — Cross-chain USDC transfers (burn on source, mint on destination)
- **[Chainlink CRE](https://docs.chain.link/cre)** — Log event trigger + report delivery from source to destination chain
- **[World ID](https://docs.worldcoin.org/)** — Proof-of-humanity verification for token issuers
- **[Uniswap CCA](https://docs.uniswap.org/)** — Continuous Clearing Auction for fair token distribution
- **[Uniswap API](https://docs.uniswap.org/)** — Swap any token to USDC on the source chain before cross-chain transfer

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

### Mainnet Deployed Addresses

| Network      | CCTPAuction | CREAuctionWrapper | CCA |
| ------------ | ----------- | ----------------- | --- |
| Base Mainnet | [`0xBFb2Cb1C39C914CBf3eE6C5B094eD71D7d8410C8`](https://basescan.org/address/0xBFb2Cb1C39C914CBf3eE6C5B094eD71D7d8410C8) | [`0xE08166250c9f666E301E9EeBE22ecDE77eA4b787`](https://basescan.org/address/0xE08166250c9f666E301E9EeBE22ecDE77eA4b787) | [`0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57`](https://basescan.org/address/0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57) |

### Testnet Deployed Addresses

| Network          | CCTPAuction | CREAuctionWrapper |
| ---------------- | ----------- | ----------------- |
| Arc Testnet      | [`0x2CDf56BE53C9758D1B9f0Fc891B650e82BB64c52`](https://testnet.arcscan.app/address/0x2CDf56BE53C9758D1B9f0Fc891B650e82BB64c52) | [`0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55`](https://testnet.arcscan.app/address/0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55) |
| Unichain Sepolia | [`0xe10288AD9581c5954f2947e6B0FF136B5a942bbf`](https://unichain-sepolia.blockscout.com/address/0xe10288AD9581c5954f2947e6B0FF136B5a942bbf) | [`0x3aE495B2cB9E9E7EBaf00C215796D23fEE3c2aE4`](https://unichain-sepolia.blockscout.com/address/0x3aE495B2cB9E9E7EBaf00C215796D23fEE3c2aE4) |
