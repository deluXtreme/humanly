// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

/// @notice Parsed bid parameters extracted from CCTP burn message hook data
/// @param auction The auction contract to submit the bid to
/// @param maxPrice The maximum price the bidder is willing to pay
/// @param bidder The user on whose behalf the bid is submitted
/// @param prevTickPrice The previous tick price for bid placement ordering
/// @param innerHookData Opaque hook data passed through to the auction contract
struct AuctionParams {
    address auction;
    uint256 maxPrice;
    address bidder;
    uint256 prevTickPrice;
    bytes29 innerHookData;
}
