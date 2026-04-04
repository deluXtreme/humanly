// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import { IReceiverV2 } from "@circlefin/evm-cctp-contracts/src/interfaces/v2/IReceiverV2.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { AuctionParams } from "src/types/AuctionParams.sol";

import { AddressUtils } from "@circlefin/evm-cctp-contracts/src/messages/v2/AddressUtils.sol";
import { MessageV2 } from "@circlefin/evm-cctp-contracts/src/messages/v2/MessageV2.sol";
import { BurnMessageV2 } from "@circlefin/evm-cctp-contracts/src/messages/v2/BurnMessageV2.sol";
import { Ownable2Step } from "@circlefin/evm-cctp-contracts/src/roles/Ownable2Step.sol";
import { TokenMessengerV2 } from "@circlefin/evm-cctp-contracts/src/v2/TokenMessengerV2.sol";
import { TypedMemView } from "@memview-sol/contracts/TypedMemView.sol";

import { CCTPAuctionHookData } from "./messages/CCTPAuctionHookData.sol";

contract CCTPAuction is Ownable2Step {
    using AddressUtils for bytes32;
    using BurnMessageV2 for bytes29;
    using MessageV2 for bytes29;
    using TypedMemView for bytes;
    using CCTPAuctionHookData for bytes29;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IReceiverV2 public immutable MESSAGE_TRANSMITTER;

    TokenMessengerV2 public immutable TOKEN_MESSENGER;

    uint32 public immutable SUPPORTED_MESSAGE_VERSION;

    uint32 public immutable SUPPORTED_BURN_MESSAGE_VERSION;

    IERC20 public immutable USDC;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _messageTransmitter,
        address _tokenMessenger,
        uint32 _supportedMessageVersion,
        uint32 _supportedBurnMessageVersion,
        address _usdc
    )
        Ownable2Step()
    {
        MESSAGE_TRANSMITTER = IReceiverV2(_messageTransmitter);
        TOKEN_MESSENGER = TokenMessengerV2(_tokenMessenger);
        SUPPORTED_MESSAGE_VERSION = _supportedMessageVersion;
        SUPPORTED_BURN_MESSAGE_VERSION = _supportedBurnMessageVersion;
        USDC = IERC20(_usdc);
    }

    /*//////////////////////////////////////////////////////////////
                  USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function mintAndSubmitBid(bytes calldata _message, bytes calldata _attestation) external {
        (uint32 sourceDomain, bytes32 burnToken, AuctionParams memory _params) = _validateCctpMessage(_message);
    }

    /*//////////////////////////////////////////////////////////////
                   INTERNAL STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _validateCctpMessage(bytes calldata _message)
        internal
        view
        returns (uint32 sourceDomain, bytes32 burnToken, AuctionParams memory _params)
    {
        bytes29 message = _message.ref(0);
        message._validateMessageFormat();
        require(MessageV2._getVersion(message) == SUPPORTED_MESSAGE_VERSION, "Unsupported message version");

        bytes29 burnMessage = message._getMessageBody();
        burnMessage._validateBurnMessageFormat();
        require(
            BurnMessageV2._getVersion(burnMessage) == SUPPORTED_BURN_MESSAGE_VERSION, "Unsupported burn message version"
        );

        sourceDomain = message._getSourceDomain();
        require(message._getRecipient().toAddress() == address(TOKEN_MESSENGER), "Invalid message recipient");

        burnToken = burnMessage._getBurnToken();
        bytes32 mintRecipient = burnMessage._getMintRecipient();
        require(mintRecipient.toAddress() == address(this), "Mint recipient must be forwarder");

        bytes29 _hookData = burnMessage._getHookData();
        _params = _hookData._parseBidParameters();
    }
}
