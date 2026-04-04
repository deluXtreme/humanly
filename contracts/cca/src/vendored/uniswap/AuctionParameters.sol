// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @custom:source uniswap/continuous-clearing-auction#a0aabaa45d8677a4944fc04d5dea2c4b499b3d3a

struct AuctionParameters {
    address currency;
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
