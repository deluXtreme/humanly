# Humanly CRE

Humanly CRE is a Base contract that integrates Chainlink Runtime Environment with the deployed CCTP auction contract.

## Deployment

- Network: Base
- Address: `0xE08166250c9f666E301E9EeBE22ecDE77eA4b787`

## Repo

- Main contract: `src/HumanlyCRE.sol`
- Deploy script: `script/Deploy.sol`

## Commands

```sh
forge build
forge test
forge script script/Deploy.sol:Deploy --rpc-url base --broadcast --verify --verifier etherscan --etherscan-api-key "$ETHERSCAN_API_KEY" --private-key "$PRIVATE_KEY"
```

For verification, set `ETHERSCAN_API_KEY` and `PRIVATE_KEY` in your environment.
