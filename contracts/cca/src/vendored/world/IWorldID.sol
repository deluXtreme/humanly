// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// github:worldcoin/world-id-protocol#64be63f6c8d0b20f80353226a9ef983c36d7e5bd

interface IWorldID {
    function verify(
        uint256 _nullifier,
        uint256 _action,
        uint64 _actionrpId,
        uint256 _nonce,
        uint256 _signalHash,
        uint64 _expiresAtMin,
        uint64 _issuerSchemaId,
        uint256 _credentialGenesisIssuedAtMin,
        uint256[5] calldata _zeroKnowledgeProof
    )
        external
        view;
}
