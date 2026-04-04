// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { Distribution } from "@uniswap/liquidity-launcher/src/types/Distribution.sol";
import { ILiquidityLauncher } from "@uniswap/liquidity-launcher/src/interfaces/ILiquidityLauncher.sol";
import { MigratorParameters } from "@uniswap/liquidity-launcher/src/types/MigratorParameters.sol";
import { AuctionParameters } from "src/vendored/uniswap/AuctionParameters.sol";
import { IWorldID } from "src/vendored/world/IWorldID.sol";

import { IHumanlyCCA } from "src/interfaces/IHumanlyCCA.sol";

import { WorldIDParams, UniswapCCAParams, MigratorParams, AuctionParams } from "src/types/Types.sol";

contract HumanlyCCA is IHumanlyCCA {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    uint8 internal constant _DECIMALS = 18;

    address internal constant _USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    IWorldID public immutable WORLD_ID_SATELLITE;

    ILiquidityLauncher public immutable LIQUIDITY_LAUNCHER;

    address public immutable UERC20_FACTORY;

    address public immutable FULL_RANGE_LBP_STRATEGY;

    mapping(uint256 => bool) internal _nullifierUsed;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _worldIDSattelite,
        address _liquidityLauncher,
        address _uerc20Factory,
        address _fullRangeLBPStrategy
    ) {
        WORLD_ID_SATELLITE = IWorldID(_worldIDSattelite);
        LIQUIDITY_LAUNCHER = ILiquidityLauncher(_liquidityLauncher);
        UERC20_FACTORY = _uerc20Factory;
        FULL_RANGE_LBP_STRATEGY = _fullRangeLBPStrategy;
    }

    /*//////////////////////////////////////////////////////////////
                  USER-FACING STATE-CHANGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function verifyAndExecute(WorldIDParams calldata _idParams, UniswapCCAParams calldata _ccaParams) external {
        if (_nullifierUsed[_idParams.nullifier]) revert InvalidNullifier();

        WORLD_ID_SATELLITE.verify(
            _idParams.nullifier,
            _idParams.action,
            _idParams.rpId,
            _idParams.nonce,
            _idParams.signalHash,
            _idParams.expiresAtMin,
            _idParams.issuerSchemaId,
            _idParams.credentialGenesisIssuedAtMin,
            _idParams.zeroKnowledgeProof
        );

        _nullifierUsed[_idParams.nullifier] = true;

        address _token = LIQUIDITY_LAUNCHER.createToken(
            UERC20_FACTORY,
            _ccaParams.createTokenParams.name,
            _ccaParams.createTokenParams.symbol,
            _DECIMALS,
            _ccaParams.createTokenParams.initialSupply,
            address(LIQUIDITY_LAUNCHER),
            _ccaParams.createTokenParams.tokenData
        );

        MigratorParams calldata mp = _ccaParams.distributeTokenParams.migratorParams;
        AuctionParams calldata ap = _ccaParams.distributeTokenParams.auctionParams;

        bytes memory configData = abi.encode(
            MigratorParameters({
                migrationBlock: mp.migrationBlock,
                currency: _USDC,
                poolLPFee: mp.poolLPFee,
                poolTickSpacing: mp.poolTickSpacing,
                tokenSplit: mp.tokenSplit,
                initializerFactory: mp.initializerFactory,
                positionRecipient: mp.positionRecipient,
                sweepBlock: mp.sweepBlock,
                operator: mp.operator,
                maxCurrencyAmountForLP: mp.maxCurrencyAmountForLP
            }),
            abi.encode(
                AuctionParameters({
                    currency: _USDC,
                    tokensRecipient: ap.tokensRecipient,
                    fundsRecipient: ap.fundsRecipient,
                    startBlock: ap.startBlock,
                    endBlock: ap.endBlock,
                    claimBlock: ap.claimBlock,
                    tickSpacing: ap.tickSpacing,
                    validationHook: ap.validationHook,
                    floorPrice: ap.floorPrice,
                    requiredCurrencyRaised: ap.requiredCurrencyRaised,
                    auctionStepsData: ap.auctionStepsData
                })
            )
        );

        Distribution memory distribution = Distribution({
            strategy: FULL_RANGE_LBP_STRATEGY,
            amount: _ccaParams.createTokenParams.initialSupply,
            configData: configData
        });

        LIQUIDITY_LAUNCHER.distributeToken(_token, distribution, false, _ccaParams.distributeTokenParams.salt);
    }
}
