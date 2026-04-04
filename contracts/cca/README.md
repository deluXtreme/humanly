# Humanly CCA

Humanly CCA is a Base contract that verifies a World ID proof, creates a token through Uniswap Liquidity Launcher, and starts its distribution flow.

## Deployment

- Network: Base
- Address: `0x27c2a11AA3E2237fDE4aE782cC36eBBB49d26c57`

## Repo

- Main contract: `src/HumanlyCCA.sol`
- Deploy script: `script/Deploy.s.sol`

## Commands

```sh
forge build
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url base --chain base --broadcast --verify --account <account>
```

For verification, set `API_KEY_ETHERSCAN` in your environment.
