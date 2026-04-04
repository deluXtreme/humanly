// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

/// @notice World ID proof payload and verification constraints for a single caller.
/// @param nullifier Unique nullifier for the proof, used to prevent replay.
/// @param action Action identifier bound to the proof.
/// @param rpId Relying party identifier expected by the verifier.
/// @param nonce Nonce included in the proof.
/// @param signalHash Hash of the expected caller-bound signal.
/// @param expiresAtMin Minimum validity timestamp for the credential.
/// @param issuerSchemaId Issuer schema identifier for the credential.
/// @param credentialGenesisIssuedAtMin Minimum credential issuance timestamp accepted by the verifier.
/// @param zeroKnowledgeProof Groth16 proof elements expected by the World ID verifier.
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

/// @notice Complete Humanly auction request, combining token creation and distribution settings.
/// @param createTokenParams Parameters for deploying the auction token.
/// @param distributeTokenParams Parameters for distributing the deployed token.
struct UniswapCCAParams {
    CreateTokenParams createTokenParams;
    DistributeTokenParams distributeTokenParams;
}

/// @notice Parameters used to create the token prior to launching distribution.
/// @param name ERC-20 name for the new token.
/// @param symbol ERC-20 symbol for the new token.
/// @param initialSupply Initial token supply minted to the liquidity launcher.
/// @param tokenData Encoded token metadata payload, e.g. `abi.encode(description, website, image)`.
struct CreateTokenParams {
    string name;
    string symbol;
    uint128 initialSupply;
    bytes tokenData; // abi.encode(description, website, image);
}

/// @notice Parameters forwarded to the Uniswap migrator configuration.
/// @param poolLPFee Fee tier for the destination Uniswap pool.
/// @param poolTickSpacing Tick spacing for the destination Uniswap pool.
/// @param positionRecipient Recipient of the migrated LP position.
/// @param migrationBlock Block at which migration becomes available.
/// @param initializerFactory Factory used to initialize the destination pool.
/// @param tokenSplit Portion of tokens allocated to migration.
/// @param sweepBlock Block after which leftover assets may be swept.
/// @param operator Address authorized to operate the migrator.
/// @param maxCurrencyAmountForLP Maximum currency amount committed to LP during migration.
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

/// @notice Parameters forwarded to the Uniswap auction strategy configuration.
/// @param tokensRecipient Recipient that receives unsold auction tokens or claimable balances.
/// @param fundsRecipient Recipient of the raised auction funds.
/// @param startBlock Block at which the auction starts.
/// @param endBlock Block at which the auction ends.
/// @param claimBlock Block at which claims become available.
/// @param tickSpacing Tick spacing used by the auction strategy.
/// @param validationHook Optional validation hook invoked by the auction strategy.
/// @param floorPrice Minimum clearing price accepted by the auction.
/// @param requiredCurrencyRaised Minimum currency target required for a successful auction.
/// @param auctionStepsData Encoded auction step configuration consumed by the strategy.
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

/// @notice Parameters for distributing the launched token through Uniswap.
/// @param salt Salt used to derive deterministic distribution state.
/// @param migratorParams Migration settings applied after the auction phase.
/// @param auctionParams Auction settings applied during distribution.
struct DistributeTokenParams {
    bytes32 salt;
    MigratorParams migratorParams;
    AuctionParams auctionParams;
}
