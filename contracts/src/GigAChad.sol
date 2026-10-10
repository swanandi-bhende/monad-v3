// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GigAChad is ReentrancyGuard {
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
        uint256 feeAmount;
        uint256 reviewPool;
        uint256 reviewPaid;
        uint256 winnerAmount;
        uint64 deadline;
        uint64 reviewEnd;
        uint8 reviewSlots;
        uint8 reviewCount;
        Status status;
        address winner;
        string metadata;
    }

    struct Submission {
        address submitter;
        string evidence;
        uint64 submittedAt;
    }

    uint256 public constant BPS = 10_000;
    uint256 public constant REVIEWER_BPS = 1_000;
    uint8 public constant MAX_REVIEW_SLOTS = 10;
    uint8 public constant MAX_SCORE = 100;

    address public immutable treasury;
    uint64 public immutable reviewPeriod;
    uint256 public bountyCount;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) private _submissions;
    mapping(uint256 => uint256[]) private _scoreTotals;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        address token,
        uint256 reward,
        uint256 feeAmount,
        uint256 reviewPool,
        uint256 winnerAmount,
        uint64 deadline,
        uint8 reviewSlots,
        string metadata
    );
    event WorkSubmitted(
        uint256 indexed bountyId, uint256 indexed submissionIndex, address indexed submitter, string evidence
    );
    event WorkReviewed(
        uint256 indexed bountyId, address indexed reviewer, uint8 reviewNumber, uint256 reward, string feedback
    );
    event WinnerSelected(
        uint256 indexed bountyId,
        uint256 indexed submissionIndex,
        address indexed winner,
        uint256 winnerAmount,
        uint256 feeAmount
    );
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount);

    error InvalidTreasury();
    error InvalidReviewPeriod();
    error InvalidToken();
    error InvalidReward();
    error InvalidDeadline();
    error InvalidReviewSlots();
    error BountyNotFound();
    error NotCreator();
    error NotOpen();
    error SubmissionWindowClosed();
    error SubmissionWindowOpen();
    error ReviewWindowClosed();
    error ReviewWindowNotOpen();
    error ReviewPeriodNotOver();
    error CreatorCannotSubmit();
    error CreatorCannotReview();
    error EmptyEvidence();
    error InvalidSubmissionIndex();
    error NoSubmissions();
    error ScoreCountMismatch();
    error InvalidScore();
    error AlreadyReviewed();
    error ConflictOfInterest();
    error ReviewSlotsFull();

    constructor(address treasury_, uint64 reviewPeriod_) {
        if (treasury_ == address(0)) revert InvalidTreasury();
        if (reviewPeriod_ == 0) revert InvalidReviewPeriod();
        treasury = treasury_;
        reviewPeriod = reviewPeriod_;
    }

    function feeBps(uint256 reward) public pure returns (uint256) {
        if (reward < 50e6) return 500;
        if (reward <= 500e6) return 400;
        return 300;
    }

    function createBounty(address token, uint256 reward, uint64 deadline, uint8 reviewSlots, string calldata metadata)
        external
        nonReentrant
        returns (uint256 bountyId)
    {
        if (token == address(0)) revert InvalidToken();
        if (reward == 0) revert InvalidReward();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (reviewSlots == 0 || reviewSlots > MAX_REVIEW_SLOTS) revert InvalidReviewSlots();

        uint256 feeAmount = (reward * feeBps(reward)) / BPS;
        uint256 reviewPool = (reward * REVIEWER_BPS) / BPS;
        if (reviewPool < reviewSlots) revert InvalidReward();
        uint256 winnerAmount = reward - feeAmount - reviewPool;

        bountyId = bountyCount++;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            token: token,
            reward: reward,
            feeAmount: feeAmount,
            reviewPool: reviewPool,
            reviewPaid: 0,
            winnerAmount: winnerAmount,
            deadline: deadline,
            reviewEnd: deadline + reviewPeriod,
            reviewSlots: reviewSlots,
            reviewCount: 0,
            status: Status.Open,
            winner: address(0),
            metadata: metadata
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), reward);

        emit BountyCreated(
            bountyId, msg.sender, token, reward, feeAmount, reviewPool, winnerAmount, deadline, reviewSlots, metadata
        );
    }

    function submitWork(uint256 bountyId, string calldata evidence) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp > bounty.deadline) revert SubmissionWindowClosed();
        if (msg.sender == bounty.creator) revert CreatorCannotSubmit();
        if (bytes(evidence).length == 0) revert EmptyEvidence();

        Submission[] storage submissions = _submissions[bountyId];
        submissions.push(Submission({submitter: msg.sender, evidence: evidence, submittedAt: uint64(block.timestamp)}));
        _scoreTotals[bountyId].push(0);

        emit WorkSubmitted(bountyId, submissions.length - 1, msg.sender, evidence);
    }

    function submitReview(uint256 bountyId, uint8[] calldata scores, string calldata feedback) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp <= bounty.deadline) revert ReviewWindowNotOpen();
        if (block.timestamp >= bounty.reviewEnd) revert ReviewWindowClosed();
        if (msg.sender == bounty.creator) revert CreatorCannotReview();
        if (hasReviewed[bountyId][msg.sender]) revert AlreadyReviewed();
        if (bounty.reviewCount >= bounty.reviewSlots) revert ReviewSlotsFull();

        Submission[] storage submissions = _submissions[bountyId];
        if (submissions.length == 0) revert NoSubmissions();
        if (scores.length != submissions.length) revert ScoreCountMismatch();

        for (uint256 i = 0; i < submissions.length; i++) {
            if (submissions[i].submitter == msg.sender) revert ConflictOfInterest();
            if (scores[i] > MAX_SCORE) revert InvalidScore();
        }

        hasReviewed[bountyId][msg.sender] = true;
        bounty.reviewCount += 1;
        uint256[] storage totals = _scoreTotals[bountyId];
        for (uint256 i = 0; i < scores.length; i++) {
            totals[i] += scores[i];
        }

        uint256 reward = bounty.reviewPool / bounty.reviewSlots;
        bounty.reviewPaid += reward;
        IERC20(bounty.token).safeTransfer(msg.sender, reward);

        emit WorkReviewed(bountyId, msg.sender, bounty.reviewCount, reward, feedback);
    }

    function selectWinner(uint256 bountyId, uint256 submissionIndex) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (msg.sender != bounty.creator) revert NotCreator();
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp <= bounty.deadline) revert SubmissionWindowOpen();
        if (block.timestamp >= bounty.reviewEnd) revert ReviewWindowClosed();

        Submission[] storage submissions = _submissions[bountyId];
        if (submissionIndex >= submissions.length) revert InvalidSubmissionIndex();

        address winner = submissions[submissionIndex].submitter;
        bounty.status = Status.Completed;
        bounty.winner = winner;

        uint256 winnerAmount = bounty.winnerAmount;
        uint256 feeAmount = bounty.feeAmount;
        uint256 unpaidReviewPool = bounty.reviewPool - bounty.reviewPaid;
        IERC20 token = IERC20(bounty.token);

        token.safeTransfer(winner, winnerAmount);
        token.safeTransfer(treasury, feeAmount);
        if (unpaidReviewPool > 0) token.safeTransfer(bounty.creator, unpaidReviewPool);

        emit WinnerSelected(bountyId, submissionIndex, winner, winnerAmount, feeAmount);
    }

    function refund(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = _existing(bountyId);
        if (msg.sender != bounty.creator) revert NotCreator();
        if (bounty.status != Status.Open) revert NotOpen();
        if (block.timestamp < bounty.reviewEnd) revert ReviewPeriodNotOver();

        uint256 amount = bounty.reward - bounty.reviewPaid;
        bounty.status = Status.Refunded;

        IERC20(bounty.token).safeTransfer(bounty.creator, amount);

        emit BountyRefunded(bountyId, bounty.creator, amount);
    }

    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        _existing(bountyId);
        return _submissions[bountyId];
    }

    function getScoreTotals(uint256 bountyId) external view returns (uint256[] memory) {
        _existing(bountyId);
        return _scoreTotals[bountyId];
    }

    function _existing(uint256 bountyId) private view returns (Bounty storage bounty) {
        if (bountyId >= bountyCount) revert BountyNotFound();
        bounty = bounties[bountyId];
    }
}
