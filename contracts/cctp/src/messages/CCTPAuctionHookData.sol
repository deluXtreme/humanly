// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import { TypedMemView } from "@memview-sol/contracts/TypedMemView.sol";
import { AuctionParams } from "src/types/AuctionParams.sol";

/// @title CCTPAuctionHookData
/// @notice Library for parsing CCTPAuction bid parameters from CCTP burn message hook data
/// @dev Hook data layout:
///      Bytes 0-3:     bytes4  - Magic value (bytes4(keccak256("CCTPAuction.Version.0")) = 0xd55705b2)
///      Bytes 4-7:     uint32  - Data length
///      Bytes 8-27:    address - Auction contract address
///      Bytes 28-59:   uint256 - maxPrice for the bid
///      Bytes 60-79:   address - Bidder (the user on whose behalf we submit the bid)
///      Bytes 80-111:  uint256 - prevTickPrice for bid placement
///      Bytes 112+:    bytes   - Inner hook data passed through to the auction contract
/// @dev Reverts if hook data is less than 112 bytes or magic value does not match.
/// @dev To upgrade, use bytes4(keccak256("CCTPAuction.Version.N")) for version N.
library CCTPAuctionHookData {
    using TypedMemView for bytes29;

    bytes4 private constant MAGIC = 0xd55705b2; // bytes4(keccak256("CCTPAuction.Version.0"))

    uint256 private constant MAGIC_INDEX = 0;
    uint8 private constant MAGIC_LENGTH = 4;

    uint256 private constant AUCTION_INDEX = 8;
    uint256 private constant MAX_PRICE_INDEX = 28;
    uint8 private constant MAX_PRICE_LENGTH = 32;
    uint256 private constant BIDDER_INDEX = 60;
    uint256 private constant PREV_TICK_PRICE_INDEX = 80;
    uint8 private constant PREV_TICK_PRICE_LENGTH = 32;
    uint256 private constant INNER_HOOK_DATA_INDEX = 112;

    uint8 private constant MIN_HOOK_LENGTH = 112;

    /// @notice Parse auction bid parameters from hook data
    /// @dev Reverts if hook data is less than 112 bytes or magic value does not match.
    /// @dev Bytes 4-7 (data length) are not validated onchain but may be used offchain.
    /// @param _hookData Hook data from the CCTP burn message
    /// @return _params Auction params required to submit a bid for the user
    function _parseBidParameters(bytes29 _hookData) internal pure returns (AuctionParams memory _params) {
        uint256 hookLength = _hookData.len();
        require(hookLength >= MIN_HOOK_LENGTH, "CCTPAuctionHookData: too short");

        bytes4 magic = bytes4(uint32(_hookData.indexUint(MAGIC_INDEX, MAGIC_LENGTH)));
        require(magic == MAGIC, "CCTPAuctionHookData: invalid magic");

        _params = AuctionParams({
            auction: _hookData.indexAddress(AUCTION_INDEX),
            maxPrice: _hookData.indexUint(MAX_PRICE_INDEX, MAX_PRICE_LENGTH),
            bidder: _hookData.indexAddress(BIDDER_INDEX),
            prevTickPrice: _hookData.indexUint(PREV_TICK_PRICE_INDEX, PREV_TICK_PRICE_LENGTH),
            innerHookData: bytes29(0)
        });

        uint256 _innerLength = hookLength - INNER_HOOK_DATA_INDEX;
        if (_innerLength > 0) {
            _params.innerHookData = _hookData.slice(INNER_HOOK_DATA_INDEX, _innerLength, 0);
        }
    }
}
