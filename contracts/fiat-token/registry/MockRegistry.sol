// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// mock contract for using interface
interface ContractRegistry {
    function contractDeployed(bytes32 _name, address _address, uint256 _block, bytes32 _tx) external;
    function contractsAddress(bytes32) external view returns (address);
}