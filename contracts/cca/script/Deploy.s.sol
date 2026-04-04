// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { Script } from "forge-std/src/Script.sol";

import { HumanlyCCA } from "src/HumanlyCCA.sol";

contract Deploy is Script {
    address internal constant WORLD_ID_SATELLITE = 0xcC72Ca7BfB5E55613505EceBB6C97dA5E1131E21;
    address internal constant LIQUIDITY_LAUNCHER = 0x00000008412db3394C91A5CbD01635c6d140637C;
    address public constant UERC20_FACTORY = 0x7737cae00C4D0eB677a66AFEF921E7d7EeD32c55;
    address public constant FULL_RANGE_LBP_STRATEGY = 0x39E5eB34dD2c8082Ee1e556351ae660F33B04252;

    function run() public returns (HumanlyCCA _cca) {
        vm.startBroadcast();
        HumanlyCCA _cca =
            new HumanlyCCA(WORLD_ID_SATELLITE, LIQUIDITY_LAUNCHER, UERC20_FACTORY, FULL_RANGE_LBP_STRATEGY);
        vm.stopBroadcast();
    }
}
