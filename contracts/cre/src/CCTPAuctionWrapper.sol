// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { ReceiverTemplate } from "src/vendored/ReceiverTemplate.sol";

contract CCTPAuctionWrapper is ReceiverTemplate {
    bytes4 internal constant _MINT_AND_SUBMIT_BID_SELECTOR = 0xdece9eac;

    address public immutable CCTP_AUCTION;

    error MintAndSubmitBidFailed();

    constructor(address _forwarderAddress, address _cctpAuction) payable ReceiverTemplate(_forwarderAddress) {
        CCTP_AUCTION = _cctpAuction;
    }

    /// @notice Forwards the validated report to CCTPAuction.mintAndSubmitBid
    /// @param report The full calldata for mintAndSubmitBid(bytes,bytes)
    function _processReport(bytes calldata report) internal override {
        require(bytes4(report[:4]) == _MINT_AND_SUBMIT_BID_SELECTOR);
        (bool _success,) = CCTP_AUCTION.call(report);
        if (!_success) revert MintAndSubmitBidFailed();
    }
}

