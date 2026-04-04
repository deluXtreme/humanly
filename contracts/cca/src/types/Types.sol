// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

struct WorldIDParams {
    uint256 nullifier;
    uint256 action;
    uint64 rpId;
    uint256 nonce;
    uint256 signalHash;
    uint64 expiresAtMin;
    uint64 issuerSchemaId;
    uint256 credentialGenesisIssuedAtMin;
    uint256[5] zeroKnowledgeProof;
}

struct UniswapCCAParams {
    CreateTokenParams createTokenParams;
    DistributeTokenParams distributeTokenParams;
}

struct CreateTokenParams {
    string name;
    string symbol;
    uint128 initialSupply;
    bytes tokenData; // abi.encode(description, website, image);
}

struct MigratorParams {
    uint24 poolLPFee;
    int24 poolTickSpacing;
    address positionRecipient;
    uint64 migrationBlock;
    address initializerFactory;
    uint24 tokenSplit;
    uint64 sweepBlock;
    address operator;
    uint128 maxCurrencyAmountForLP;
}

struct AuctionParams {
    address tokensRecipient;
    address fundsRecipient;
    uint64 startBlock;
    uint64 endBlock;
    uint64 claimBlock;
    uint256 tickSpacing;
    address validationHook;
    uint256 floorPrice;
    uint128 requiredCurrencyRaised;
    bytes auctionStepsData;
}

struct DistributeTokenParams {
    bytes32 salt;
    MigratorParams migratorParams;
    AuctionParams auctionParams;
}
