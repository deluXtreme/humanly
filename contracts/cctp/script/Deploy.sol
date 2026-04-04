// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import {CCTPAuction} from "src/CCTPAuction.sol";
import {Script} from "forge-std/src/Script.sol";

contract Deploy is Script {
    struct DeploymentParams {
        address messageTransmitter;
        address tokenMessenger;
        uint32 supportedMessageVersion;
        uint32 supportedBurnMessageVersion;
        address usdc;
    }

    mapping(uint256 => DeploymentParams) internal _deploymentParams;

    function setUp() public {
        // Mainnet
        _deploymentParams[1] = DeploymentParams({
            messageTransmitter: address(0), // TODO: fill in
            tokenMessenger: address(0), // TODO: fill in
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        });

        // Sepolia
        _deploymentParams[11_155_111] = DeploymentParams({
            messageTransmitter: address(0), // TODO: fill in
            tokenMessenger: address(0), // TODO: fill in
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: address(0) // TODO: fill in
        });
    }

    function _getChainId() internal pure returns (uint256 _chainId) {
        assembly {
            _chainId := chainid()
        }
    }

    function run() public returns (CCTPAuction _cctpAuction) {
        DeploymentParams memory _params = _deploymentParams[_getChainId()];

        vm.startBroadcast();
        _cctpAuction = new CCTPAuction(
            _params.messageTransmitter,
            _params.tokenMessenger,
            _params.supportedMessageVersion,
            _params.supportedBurnMessageVersion,
            _params.usdc
        );
        vm.stopBroadcast();
    }
}
