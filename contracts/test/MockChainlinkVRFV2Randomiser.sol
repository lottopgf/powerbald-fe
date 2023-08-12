// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IRandomiserGen2.sol";
import "../interfaces/IRandomiserCallbackSingle.sol";
import "hardhat/console.sol";

contract MockChainlinkVRFV2Randomiser is IRandomiserGen2, Ownable {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) private requestIdToCallbackMap;
    mapping(address => bool) public authorisedContracts;

    event RandomNumberRequested(uint256 indexed requestId);
    event RandomNumberFulfilled(uint256 indexed requestId, uint256 randomness);

    constructor() {
        authorisedContracts[msg.sender] = true;
    }

    function computeTotalRequestCostETH(
        uint32 callbackGasLimit
    ) public pure returns (uint256) {
        return uint256(callbackGasLimit) * 10 gwei;
    }

    /**
     * Requests randomness
     */
    function getRandomNumber(
        address callbackContract,
        uint32 callbackGasLimit,
        uint16 /** min confs */
    ) public payable returns (uint256 requestId) {
        requestId = nextRequestId++;
        requestIdToCallbackMap[requestId] = callbackContract;
        emit RandomNumberRequested(requestId);
        return requestId;
    }

    /**
     * Callback function used by VRF Coordinator (V2)
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) external {
        require(requestId < nextRequestId, "Request ID doesn't exist");
        address callbackContract = requestIdToCallbackMap[requestId];
        delete requestIdToCallbackMap[requestId];
        IRandomiserCallbackSingle(callbackContract).receiveRandomWord(
            requestId,
            randomWords[0]
        );
        emit RandomNumberFulfilled(requestId, randomWords[0]);
    }

    modifier onlyAuthorised() {
        require(authorisedContracts[msg.sender], "Not authorised");
        _;
    }

    function authorise(address account) public onlyAuthorised {
        authorisedContracts[account] = true;
    }

    function deauthorise(address account) external onlyAuthorised {
        authorisedContracts[account] = false;
    }
}
