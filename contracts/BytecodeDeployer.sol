// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/// @title BytecodeDeployer
/// @notice Deploy contract from bytecode
contract BytecodeDeployer {
    event ContractDeployed(address destination);

    function deployBytecode(
        bytes calldata contractBytecode,
        bytes calldata args
    ) external returns (address deployed) {
        bytes memory bytecode = abi.encodePacked(contractBytecode, args);
        assembly {
            deployed := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        require(deployed != address(0), "Failed to deploy");
        emit ContractDeployed(deployed);
    }
}
