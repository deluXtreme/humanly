// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import { CCTPAuction } from "src/CCTPAuction.sol";
import { Script } from "forge-std/src/Script.sol";

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
        // Arc Testnet
        _deploymentParams[5_042_002] = DeploymentParams({
            messageTransmitter: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275,
            tokenMessenger: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA,
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0x3600000000000000000000000000000000000000
        });
        // Base Sepolia
        _deploymentParams[84_532] = DeploymentParams({
            messageTransmitter: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275,
            tokenMessenger: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA,
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
        });

        // Base Mainnet
        _deploymentParams[8453] = DeploymentParams({
            messageTransmitter: 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64,
            tokenMessenger: 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d,
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
        });

        // Unichain Mainnet
        _deploymentParams[130] = DeploymentParams({
            messageTransmitter: 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64,
            tokenMessenger: 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d,
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0x078D782b760474a361dDA0AF3839290b0EF57AD6
        });

        // Unichain Sepolia
        _deploymentParams[1301] = DeploymentParams({
            messageTransmitter: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275,
            tokenMessenger: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA,
            supportedMessageVersion: 1,
            supportedBurnMessageVersion: 1,
            usdc: 0x31d0220469e10c4E71834a79b1f276d740d3768F
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
