// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { ILiquidityLauncher } from "@uniswap/liquidity-launcher/src/interfaces/ILiquidityLauncher.sol";
import { IWorldID } from "src/vendored/world/IWorldID.sol";

import { WorldIDParams, UniswapCCAParams } from "src/types/Types.sol";

/// @title IHumanlyCCA
/// @notice Interface for the Humanly contract-controlled auction entrypoint.
interface IHumanlyCCA {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when a World ID nullifier has already been consumed.
    error InvalidNullifier();

    /// @notice Thrown when the provided World ID signal hash does not match the caller and payload.
    error InvalidSignalHash();

    /*//////////////////////////////////////////////////////////////
                  USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Verifies a World ID proof and launches a Uniswap liquidity distribution for a newly created token.
    /// @param _idParams World ID verification inputs for the caller.
    /// @param _ccaParams Token creation and distribution configuration.
    function verifyAndExecute(WorldIDParams calldata _idParams, UniswapCCAParams calldata _ccaParams) external;

    /*//////////////////////////////////////////////////////////////
                        INTERNAL VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the World ID satellite verifier used by this contract.
    /// @return _satellite The configured World ID verifier contract.
    function WORLD_ID_SATELLITE() external view returns (IWorldID _satellite);

    /// @notice Returns the Uniswap liquidity launcher used for token creation and distribution.
    /// @return _launcher The configured liquidity launcher contract.
    function LIQUIDITY_LAUNCHER() external view returns (ILiquidityLauncher _launcher);

    /// @notice Returns the factory used to deploy the launched token.
    /// @return _factory The configured UERC20 factory address.
    function UERC20_FACTORY() external view returns (address _factory);

    /// @notice Returns the full-range LBP strategy used during distribution.
    /// @return _strategy The configured launch strategy address.
    function FULL_RANGE_LBP_STRATEGY() external view returns (address _strategy);
}
