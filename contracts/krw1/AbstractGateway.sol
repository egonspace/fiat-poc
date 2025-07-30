// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {FiatTokenV2_2} from "../fiat-token/v2/FiatTokenV2_2.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract AbstractGateway is OwnableUpgradeable, UUPSUpgradeable {
    FiatTokenV2_2 public fiat;
    address public gatewayMaster;
    uint256 public totalAccumulatedMinted;
    uint256 public totalAccumulatedBurnt;
    mapping(uint256 => bool) public usedTxId;
    mapping(address => bool) public minters;
    mapping(address => uint256) public accumulatedMinted;
    mapping(address => uint256) public accumulatedBurnt;

    event UpgradeImplementation(address indexed _implementation);
    event NewGatewayMasterSet(address _old, address indexed _new);
    event NewMinterRegistered(address _minter);
    event MinterUnregistered(address _minter);

    modifier useTxId(uint256 _txId) {
        require(!usedTxId[_txId], "AbstractGateway: txId was already used");
        usedTxId[_txId] = true;
        _;
    }

    modifier onlyGatewayMaster() {
        require(gatewayMaster != address(0), "AbstractGateway: master minter is not set yet");
        require(msg.sender == gatewayMaster, "AbstractGateway: only gateway master can do the operation");
        _;
    }

    modifier onlyMinter(address _owner) {
        require(minters[_owner], "AbstractGateway: token owner is not a minter");
        _;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{}

    function initialize(
        address _fiatTokenAddress,
        address _gatewayMaster
    ) public initializer {
        require(_fiatTokenAddress != address(0), "AbstractGateway: fiat token address cannot be zero");
        require(_gatewayMaster != address(0), "AbstractGateway: gateway master address cannot be zero");

        fiat = FiatTokenV2_2(_fiatTokenAddress);
        gatewayMaster = _gatewayMaster;

        emit NewGatewayMasterSet(address(0), gatewayMaster);

        __Ownable_init();
    }

    function upgradeTo(address newImplementation) public override onlyOwner {
        _upgradeToAndCallUUPS(newImplementation, '', false);
        emit UpgradeImplementation(newImplementation);
    }

    function setGatewayMaster(address _newGatewayMaster) external onlyOwner {
        emit NewGatewayMasterSet(gatewayMaster, _newGatewayMaster);

        gatewayMaster = _newGatewayMaster;
    }

    function registerMinter(address _newMinter) external onlyGatewayMaster {
        require(!minters[_newMinter], "AbstractGateway: _newMinter is already a minter");
        minters[_newMinter] = true;
        emit NewMinterRegistered(_newMinter);
    }

    function unregisterMinter(address _minter) external onlyGatewayMaster {
        require(minters[_minter], "AbstractGateway: _minter is not a minter");
        minters[_minter] = false;
        emit MinterUnregistered(_minter);
    }

    function mintCommon(
        address _minter,
        uint256 _amount,
        uint256 _txId) internal onlyGatewayMaster useTxId(_txId) onlyMinter(_minter) {

        fiat.mint(_minter, _amount);

        accumulatedMinted[_minter] += _amount;
        totalAccumulatedMinted += _amount;
    }

    function burnCommon(
        address _owner,
        uint256 _amount,
        uint256 _permitDeadline,
        bytes memory _permitSignature,
        uint256 _txId) internal onlyGatewayMaster useTxId(_txId) onlyMinter(_owner) {

        fiat.permit(_owner, address(this), _amount, _permitDeadline, _permitSignature);
        fiat.transferFrom(_owner, address(this), _amount);
        fiat.burn(_amount);

        accumulatedBurnt[_owner] += _amount;
        totalAccumulatedBurnt += _amount;
    }
}
