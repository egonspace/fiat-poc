// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./AbstractGateway.sol";

contract BridgeGateway is AbstractGateway {
    event FiatTokenMintedForEntrance(uint256 indexed _txId, address indexed _minter, uint256 _amount, uint32 _sourceDomain, address _sourceSender);
    event FiatTokenBurntForExit(uint256 indexed _txId, address indexed _minter, uint256 _amount, uint32 _destinationDomain, address _destinationRecipient);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function mintForEntrance(
        address _minter,
        uint256 _amount,
        uint32 _sourceDomain,
        address _sourceSender,
        uint256 _txId) external {

        mintCommon(_minter, _amount, _txId);

        emit FiatTokenMintedForEntrance(_txId, _minter, _amount, _sourceDomain, _sourceSender);
    }

    function burnForExit(
        address _owner,
        uint256 _amount,
        uint32 _destinationDomain,
        address _destinationRecipient,
        uint256 _permitDeadline,
        bytes memory _permitSignature,
        uint256 _txId) external {

        burnCommon(_owner, _amount, _permitDeadline, _permitSignature, _txId);

        emit FiatTokenBurntForExit(_txId, _owner, _amount, _destinationDomain, _destinationRecipient);
    }
}
