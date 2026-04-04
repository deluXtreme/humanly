# Humanly CCTP

Humanly CCTP is a Base contract for CCTP-based auction flows.

## Deployment

- Network: Base
- Address: `0xBFb2Cb1C39C914CBf3eE6C5B094eD71D7d8410C8`

## Repo

- Main contract: `src/CCTPAuction.sol`
- Deploy script: `script/Deploy.sol`

## Commands

```sh
forge build
forge test
forge script script/Deploy.sol:Deploy --rpc-url base --broadcast --verify --verifier etherscan --etherscan-api-key "$ETHERSCAN_API_KEY" --private-key "$PRIVATE_KEY"
```

For verification, set `ETHERSCAN_API_KEY` and `PRIVATE_KEY` in your environment.
