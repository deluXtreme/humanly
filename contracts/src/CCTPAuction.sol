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
import { SafeCast } from "@openzeppelin/contracts/utils/SafeCast.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

import { CCTPAuctionHookData } from "./messages/CCTPAuctionHookData.sol";

/// @title CCTPAuction
/// @notice Receives cross-chain USDC via CCTP and submits auction bids on behalf of users
/// @dev Acts as a CCTP mint recipient that forwards minted tokens into an auction contract.
///      If the bid submission fails, minted tokens are transferred directly to the bidder.
contract CCTPAuction is Ownable2Step {
    using AddressUtils for bytes32;
    using BurnMessageV2 for bytes29;
    using MessageV2 for bytes29;
    using SafeCast for uint256;
    using SafeMath for uint256;
    using TypedMemView for bytes;
    using CCTPAuctionHookData for bytes29;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a bid is successfully submitted to the auction contract
    event BidSubmitted(address indexed _auction, address indexed _bidder, uint256 _bidId, uint128 _amount);

    /// @notice Emitted when bid submission fails and minted tokens are transferred to the bidder
    event BidFailed(address indexed _auction, address indexed _bidder, uint128 _amount);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The CCTP MessageTransmitter used to receive cross-chain messages
    IReceiverV2 public immutable MESSAGE_TRANSMITTER;

    /// @notice The CCTP TokenMessenger used to resolve local token addresses
    TokenMessengerV2 public immutable TOKEN_MESSENGER;

    /// @notice The expected CCTP message version
    uint32 public immutable SUPPORTED_MESSAGE_VERSION;

    /// @notice The expected CCTP burn message version
    uint32 public immutable SUPPORTED_BURN_MESSAGE_VERSION;

    /// @notice The USDC token on this chain
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

    /// @notice Mints USDC via CCTP and submits an auction bid on behalf of the user
    /// @dev If approve or submitBid fails, minted tokens are transferred directly to the bidder.
    /// @param _message The CCTP message containing the burn and hook data
    /// @param _attestation The attestation for the CCTP message
    function mintAndSubmitBid(bytes calldata _message, bytes calldata _attestation) external {
        (uint32 _sourceDomain, bytes32 _burnToken, AuctionParams memory _params) = _validateCctpMessage(_message);

        address _localToken = TOKEN_MESSENGER.localMinter().getLocalToken(_sourceDomain, _burnToken);

        uint128 _amountMinted = _mintThroughCctp(_localToken, _message, _attestation);

        bool _success;
        bytes memory _returnData;

        if (IERC20(_localToken).approve(_params.auction, _amountMinted)) {
            (_success, _returnData) = _params.auction
                .call(
                    abi.encodeWithSignature(
                        "submitBid(uint256,uint128,address,uint256,bytes)",
                        _params.maxPrice,
                        _amountMinted,
                        _params.bidder,
                        _params.prevTickPrice,
                        TypedMemView.clone(_params.innerHookData)
                    )
                );
        }

        if (_success) {
            uint256 _bidId = abi.decode(_returnData, (uint256));
            emit BidSubmitted(_params.auction, _params.bidder, _bidId, _amountMinted);
        } else {
            IERC20(_localToken).approve(_params.auction, 0);
            require(IERC20(_localToken).transfer(_params.bidder, _amountMinted), "Failed to transfer");
            emit BidFailed(_params.auction, _params.bidder, _amountMinted);
        }
    }

    /*//////////////////////////////////////////////////////////////
                   INTERNAL STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Mints tokens by forwarding the CCTP message to the MessageTransmitter
    /// @param _localTokenAddress The local token expected to be minted
    /// @param _message The CCTP message
    /// @param _attestation The attestation for the CCTP message
    /// @return _amountMinted The amount of tokens minted
    function _mintThroughCctp(
        address _localTokenAddress,
        bytes calldata _message,
        bytes calldata _attestation
    )
        internal
        returns (uint128 _amountMinted)
    {
        IERC20 _localToken = IERC20(_localTokenAddress);
        uint256 _startingBalance = _localToken.balanceOf(address(this));
        require(MESSAGE_TRANSMITTER.receiveMessage(_message, _attestation), "Failed to receive message");
        _amountMinted = _localToken.balanceOf(address(this)).sub(_startingBalance).toUint128();
        require(_amountMinted > 0, "No tokens minted");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Validates a CCTP message and extracts auction bid parameters from its hook data
    /// @param _message The raw CCTP message
    /// @return sourceDomain The source domain of the CCTP message
    /// @return burnToken The burned token identifier on the source chain
    /// @return _params The parsed auction bid parameters
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
