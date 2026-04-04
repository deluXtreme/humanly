// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {CCTPAuctionWrapper} from "src/CCTPAuctionWrapper.sol";
import {Script} from "forge-std/src/Script.sol";

contract Deploy is Script {
    struct DeploymentParams {
        address forwarder;
        address cctpAuction;
    }

    /// @notice Deployment parameters for each chain
    mapping(uint256 _chainId => DeploymentParams _params) internal _deploymentParams;

    function setUp() public {
        // Mainnet
        _deploymentParams[1] = DeploymentParams({
            forwarder: address(0), // TODO: fill in
            cctpAuction: address(0) // TODO: fill in after deploying CCTPAuction
        });

        // Sepolia
        _deploymentParams[11_155_111] = DeploymentParams({
            forwarder: address(0), // TODO: fill in
            cctpAuction: address(0) // TODO: fill in after deploying CCTPAuction
        });
    }

    function run() public returns (CCTPAuctionWrapper _wrapper) {
        DeploymentParams memory _params = _deploymentParams[block.chainid];

        vm.startBroadcast();
        _wrapper = new CCTPAuctionWrapper(_params.forwarder, _params.cctpAuction);
        vm.stopBroadcast();
    }
}
