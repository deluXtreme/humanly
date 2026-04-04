// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

struct AuctionParams {
    address _auction;
    uint256 _maxPrice;
    address _bidder;
    uint256 _prevTickPrice;
    bytes29 _innerHookData;
}
