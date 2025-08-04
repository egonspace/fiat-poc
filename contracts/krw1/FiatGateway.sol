// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./AbstractGateway.sol";

contract FiatGateway is AbstractGateway {
    event FiatTokenMintedForFiat(uint256 indexed _txId, address indexed _minter, uint256 _amount);
    event FiatTokenBurntFromFiat(uint256 indexed _txId, address indexed _minter, uint256 _amount);
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
        emit FiatTokenMintedForFiat(_txId, _minter, _amount);
    }

    function burnForFiat(
        address _owner,
        uint256 _amount,
        uint256 _permitDeadline,
        bytes memory _permitSignature,
        uint256 _txId) external {

        require(_amount % (10**fiat.decimals()) == 0, "FiatGateway: only whole token amounts can be burned");

        burnCommon(_owner, _amount, _permitDeadline, _permitSignature, _txId);

        emit FiatTokenBurntFromFiat(_txId, _owner, _amount);
    }

    function transferFrom(
        address _owner,
        address _to,
        uint256 _amount,
        uint256 _permitDeadline,
        bytes memory _permitSignature,
        uint256 _txId) external onlyGatewayMaster useTxId(_txId) onlyMinter(_owner) {

        fiat.permit(_owner, address(this), _amount, _permitDeadline, _permitSignature);
        fiat.transferFrom(_owner, _to, _amount);

        emit FiatTokenTransferred(_txId, _owner, _to, _amount);
    }
}
