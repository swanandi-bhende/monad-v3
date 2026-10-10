// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ProofBounty is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Open,
        Completed,
        Refunded
    }

    struct Bounty {
        address creator;
        address token;
        uint256 reward;
        uint64 deadline;
        uint64 reviewEnd;
        Status status;
        address winner;
        string metadata;
    }

    struct Submission {
        address submitter;
        string evidence;
        uint64 submittedAt;
    }

    uint64 public immutable reviewPeriod;
    uint256 public bountyCount;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) private _submissions;

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        address token,
        uint256 reward,
        uint64 deadline,
        string metadata
    );
    event WorkSubmitted(
        uint256 indexed bountyId, uint256 indexed submissionIndex, address indexed submitter, string evidence
    );
    event WinnerSelected(
        uint256 indexed bountyId, uint256 indexed submissionIndex, address indexed winner, uint256 reward
    );
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 reward);

    error InvalidReviewPeriod();
    error InvalidToken();
    error InvalidReward();
    error InvalidDeadline();
    error BountyNotFound();
    error NotCreator();
    error NotOpen();
    error SubmissionWindowClosed();
    error ReviewWindowClosed();
    error ReviewPeriodNotOver();
    error CreatorCannotSubmit();
    error EmptyReference();
    error InvalidSubmissionIndex();

    constructor(uint64 reviewPeriod_) {
        if (reviewPeriod_ == 0) revert InvalidReviewPeriod();
        reviewPeriod = reviewPeriod_;
    }

    function createBounty(address token, uint256 reward, uint64 deadline, string calldata metadata)
        external
        nonReentrant
        returns (uint256 bountyId)
    {
        if (token == address(0)) revert InvalidToken();
        if (reward == 0) revert InvalidReward();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        bountyId = bountyCount++;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            token: token,
            reward: reward,
            deadline: deadline,
            reviewEnd: deadline + reviewPeriod,
            status: Status.Open,
            winner: address(0),
            metadata: metadata
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), reward);

        emit BountyCreated(bountyId, msg.sender, token, reward, deadline, metadata);
    }

    function submitWork(uint256 bountyId, string calldata evidence) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp > bounty.deadline) revert SubmissionWindowClosed();
        if (msg.sender == bounty.creator) revert CreatorCannotSubmit();
        if (bytes(evidence).length == 0) revert EmptyReference();

        Submission[] storage submissions = _submissions[bountyId];
        submissions.push(Submission({submitter: msg.sender, evidence: evidence, submittedAt: uint64(block.timestamp)}));

        emit WorkSubmitted(bountyId, submissions.length - 1, msg.sender, evidence);
    }

    function selectWinner(uint256 bountyId, uint256 submissionIndex) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (msg.sender != bounty.creator) revert NotCreator();
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp >= bounty.reviewEnd) revert ReviewWindowClosed();

        Submission[] storage submissions = _submissions[bountyId];
        if (submissionIndex >= submissions.length) revert InvalidSubmissionIndex();

        address winner = submissions[submissionIndex].submitter;
        uint256 reward = bounty.reward;
        bounty.status = Status.Completed;
        bounty.winner = winner;

        IERC20(bounty.token).safeTransfer(winner, reward);

        emit WinnerSelected(bountyId, submissionIndex, winner, reward);
    }

    function refund(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (msg.sender != bounty.creator) revert NotCreator();
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp < bounty.reviewEnd) revert ReviewPeriodNotOver();

        uint256 reward = bounty.reward;
        bounty.status = Status.Refunded;

        IERC20(bounty.token).safeTransfer(bounty.creator, reward);

        emit BountyRefunded(bountyId, bounty.creator, reward);
    }

    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        _existing(bountyId);
        return _submissions[bountyId];
    }

    function _existing(uint256 bountyId) private view returns (Bounty storage bounty) {
        if (bountyId >= bountyCount) revert BountyNotFound();
        bounty = bounties[bountyId];
    }
}
