// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8;

interface IRandomiserCallbackSingle {
    /// @notice Receive a random word from a randomiser.
    /// @dev Ensure that proper access control is enforced on this function;
    ///     only the designated randomiser may call this function and the
    ///     requestId should be as expected from the randomness request.
    /// @param requestId The identifier for the original randomness request
    /// @param randomWord An arbitrary array of random numbers
    function receiveRandomWord(uint256 requestId, uint256 randomWord) external;
}
