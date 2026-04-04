// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { ILiquidityLauncher } from "@uniswap/liquidity-launcher/src/interfaces/ILiquidityLauncher.sol";
import { IWorldID } from "src/vendored/world/IWorldID.sol";

import { WorldIDParams, UniswapCCAParams } from "src/types/Types.sol";

interface IHumanlyCCA {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidNullifier();

    /*//////////////////////////////////////////////////////////////
                  USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function verifyAndExecute(WorldIDParams calldata _idParams, UniswapCCAParams calldata _ccaParams) external;

    /*//////////////////////////////////////////////////////////////
                        INTERNAL VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function WORLD_ID_SATELLITE() external view returns (IWorldID _satellite);

    function LIQUIDITY_LAUNCHER() external view returns (ILiquidityLauncher _launcher);

    function UERC20_FACTORY() external view returns (address _factory);

    function FULL_RANGE_LBP_STRATEGY() external view returns (address _strategy);
}
