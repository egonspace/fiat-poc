// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./AbstractGateway.sol";

contract FiatGateway is AbstractGateway {
    event FiatTokenMintedFromFiat(uint256 indexed _txId, address indexed _minter, uint256 _amount);
    event FiatTokenBurntForFiat(uint256 indexed _txId, address indexed _minter, uint256 _amount);
    event FiatTokenTransferred(uint256 indexed _txId, address indexed _minter, address _to, uint256 _amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function mintFromFiat(
        address _minter,
        uint256 _amount,
        uint256 _txId) external {

        mintCommon(_minter, _amount, _txId);
        emit FiatTokenMintedFromFiat(_txId, _minter, _amount);
    }

    function burnForFiat(
        address _owner,
        uint256 _amount,
        uint256 _permitDeadline,
        bytes memory _permitSignature,
        uint256 _txId) external {

        require(_amount % (10**fiat.decimals()) == 0, "FiatGateway: only whole token amounts can be burned");

        burnCommon(_owner, _amount, _permitDeadline, _permitSignature, _txId);

        emit FiatTokenBurntForFiat(_txId, _owner, _amount);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _validAfter,
        uint256 _validBefore,
        bytes32 _nonce,
        bytes memory _signature,
        uint256 _txId) external onlyGatewayMaster useTxId(_txId) onlyMinter(_from) {

        fiat.transferWithAuthorization(_from, _to, _amount, _validAfter, _validBefore, _nonce, _signature);

        emit FiatTokenTransferred(_txId, _from, _to, _amount);
    }
}
