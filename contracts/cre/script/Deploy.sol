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
        // Base Sepolia
        // Forwarder: https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts
        _deploymentParams[84_532] = DeploymentParams({
            forwarder: 0xF8344CFd5c43616a4366C34E3EEE75af79a74482,
            cctpAuction: address(0) // TODO: fill in after deploying CCTPAuction
        });

        // Base Mainnet
        // Forwarder: https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts
        _deploymentParams[8453] = DeploymentParams({
            forwarder: 0xF8344CFd5c43616a4366C34E3EEE75af79a74482,
            cctpAuction: address(0) // TODO: fill in after deploying CCTPAuction
        });

        // Unichain Mainnet
        // Forwarder: https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts
        _deploymentParams[130] = DeploymentParams({
            forwarder: address(0), // TODO: fill in when available
            cctpAuction: address(0) // TODO: fill in after deploying CCTPAuction
        });

        // Unichain Sepolia
        // Forwarder: https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts
        _deploymentParams[1301] = DeploymentParams({
            forwarder: 0x98B8335d29Aca40840Ed8426dA1A0aAa8677d8D1,
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
