// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProofBounty} from "./ProofBounty.sol";

contract SubmissionCredibility {
    enum Signal {
        None,
        Credible,
        LowQuality
    }

    struct Tally {
        uint256 credible;
        uint256 lowQuality;
    }

    ProofBounty public immutable bounty;

    mapping(uint256 => mapping(uint256 => Tally)) private _tallies;
    mapping(uint256 => mapping(uint256 => mapping(address => Signal))) public signalOf;

    event SignalMarked(uint256 indexed bountyId, uint256 indexed submissionIndex, address indexed voter, Signal signal);

    error SubmissionNotFound();
    error OwnSubmission();
    error AlreadyMarked();
    error InvalidSignal();

    constructor(ProofBounty bounty_) {
        bounty = bounty_;
    }

    function mark(uint256 bountyId, uint256 submissionIndex, Signal signal) external {
        if (signal != Signal.Credible && signal != Signal.LowQuality) revert InvalidSignal();

        ProofBounty.Submission[] memory submissions = bounty.getSubmissions(bountyId);
        if (submissionIndex >= submissions.length) revert SubmissionNotFound();
        if (submissions[submissionIndex].submitter == msg.sender) revert OwnSubmission();
        if (signalOf[bountyId][submissionIndex][msg.sender] != Signal.None) revert AlreadyMarked();

        signalOf[bountyId][submissionIndex][msg.sender] = signal;
        Tally storage tally = _tallies[bountyId][submissionIndex];
        if (signal == Signal.Credible) {
            tally.credible += 1;
        } else {
            tally.lowQuality += 1;
        }

        emit SignalMarked(bountyId, submissionIndex, msg.sender, signal);
    }

    function tally(uint256 bountyId, uint256 submissionIndex)
        external
        view
        returns (uint256 credible, uint256 lowQuality)
    {
        Tally storage t = _tallies[bountyId][submissionIndex];
        return (t.credible, t.lowQuality);
    }
}
