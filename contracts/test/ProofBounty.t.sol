// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ProofBounty} from "../src/ProofBounty.sol";

contract ProofBountyTest is Test {
    ProofBounty internal bounty;
    ERC20Mock internal token;

    address internal creator = makeAddr("creator");
    address internal worker = makeAddr("worker");
    address internal other = makeAddr("other");

    uint64 internal constant REVIEW_PERIOD = 1 days;
    uint256 internal constant REWARD = 5e6;
    string internal constant METADATA = "{\"title\":\"Find a bug\"}";
    string internal constant EVIDENCE = "https://example.com/proof";

    uint64 internal deadline;

    function setUp() public {
        bounty = new ProofBounty(REVIEW_PERIOD);
        token = new ERC20Mock();
        token.mint(creator, 100e6);
        token.mint(other, 100e6);
        deadline = uint64(block.timestamp + 1 hours);
        vm.prank(creator);
        token.approve(address(bounty), type(uint256).max);
    }

    function _create() internal returns (uint256 id) {
        vm.prank(creator);
        id = bounty.createBounty(address(token), REWARD, deadline, METADATA);
    }

    function _submit(uint256 id, address who) internal {
        vm.prank(who);
        bounty.submitWork(id, EVIDENCE);
    }

    function test_CreateFundsEscrow() public {
        uint256 id = _create();

        assertEq(id, 0);
        assertEq(bounty.bountyCount(), 1);
        assertEq(token.balanceOf(address(bounty)), REWARD);
        assertEq(token.balanceOf(creator), 100e6 - REWARD);

        (
            address c,
            address t,
            uint256 reward,
            uint64 d,
            uint64 reviewEnd,
            ProofBounty.Status status,
            address winner,
            string memory metadata
        ) = bounty.bounties(id);
        assertEq(c, creator);
        assertEq(t, address(token));
        assertEq(reward, REWARD);
        assertEq(d, deadline);
        assertEq(reviewEnd, deadline + REVIEW_PERIOD);
        assertEq(uint8(status), uint8(ProofBounty.Status.Open));
        assertEq(winner, address(0));
        assertEq(metadata, METADATA);
    }

    function test_CreateEmitsEvent() public {
        vm.expectEmit(true, true, false, true, address(bounty));
        emit ProofBounty.BountyCreated(0, creator, address(token), REWARD, deadline, METADATA);
        _create();
    }

    function test_CreateRevertsOnInvalidInput() public {
        vm.startPrank(creator);
        vm.expectRevert(ProofBounty.InvalidToken.selector);
        bounty.createBounty(address(0), REWARD, deadline, METADATA);

        vm.expectRevert(ProofBounty.InvalidReward.selector);
        bounty.createBounty(address(token), 0, deadline, METADATA);

        vm.expectRevert(ProofBounty.InvalidDeadline.selector);
        bounty.createBounty(address(token), REWARD, uint64(block.timestamp), METADATA);
        vm.stopPrank();
    }

    function test_ConstructorRejectsZeroReviewPeriod() public {
        vm.expectRevert(ProofBounty.InvalidReviewPeriod.selector);
        new ProofBounty(0);
    }

    function test_SubmitWorkRecordsSubmission() public {
        uint256 id = _create();
        _submit(id, worker);

        ProofBounty.Submission[] memory subs = bounty.getSubmissions(id);
        assertEq(subs.length, 1);
        assertEq(subs[0].submitter, worker);
        assertEq(subs[0].evidence, EVIDENCE);
        assertEq(subs[0].submittedAt, block.timestamp);
    }

    function test_SubmitWorkAtDeadlineIsAccepted() public {
        uint256 id = _create();
        vm.warp(deadline);
        _submit(id, worker);
        assertEq(bounty.getSubmissions(id).length, 1);
    }

    function test_LateSubmissionReverts() public {
        uint256 id = _create();
        vm.warp(deadline + 1);
        vm.prank(worker);
        vm.expectRevert(ProofBounty.SubmissionWindowClosed.selector);
        bounty.submitWork(id, EVIDENCE);
    }

    function test_CreatorCannotSubmit() public {
        uint256 id = _create();
        vm.prank(creator);
        vm.expectRevert(ProofBounty.CreatorCannotSubmit.selector);
        bounty.submitWork(id, EVIDENCE);
    }

    function test_EmptyEvidenceReverts() public {
        uint256 id = _create();
        vm.prank(worker);
        vm.expectRevert(ProofBounty.EmptyReference.selector);
        bounty.submitWork(id, "");
    }

    function test_UnknownBountyReverts() public {
        vm.prank(worker);
        vm.expectRevert(ProofBounty.BountyNotFound.selector);
        bounty.submitWork(7, EVIDENCE);
    }

    function test_SelectWinnerPaysWinnerDirectly() public {
        uint256 id = _create();
        _submit(id, worker);
        _submit(id, other);

        vm.prank(creator);
        bounty.selectWinner(id, 1);

        assertEq(token.balanceOf(other), 100e6 + REWARD);
        assertEq(token.balanceOf(worker), 0);
        assertEq(token.balanceOf(address(bounty)), 0);

        (,,,,, ProofBounty.Status status, address winner,) = bounty.bounties(id);
        assertEq(uint8(status), uint8(ProofBounty.Status.Completed));
        assertEq(winner, other);
    }

    function test_SelectWinnerEmitsEvent() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.expectEmit(true, true, true, true, address(bounty));
        emit ProofBounty.WinnerSelected(id, 0, worker, REWARD);
        vm.prank(creator);
        bounty.selectWinner(id, 0);
    }

    function test_UnauthorizedWinnerSelectionReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.prank(other);
        vm.expectRevert(ProofBounty.NotCreator.selector);
        bounty.selectWinner(id, 0);
    }

    function test_InvalidSubmissionIndexReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.prank(creator);
        vm.expectRevert(ProofBounty.InvalidSubmissionIndex.selector);
        bounty.selectWinner(id, 1);
    }

    function test_DuplicateSettlementReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.startPrank(creator);
        bounty.selectWinner(id, 0);
        vm.expectRevert(ProofBounty.NotOpen.selector);
        bounty.selectWinner(id, 0);
        vm.stopPrank();

        assertEq(token.balanceOf(worker), REWARD);
    }

    function test_RefundAfterWinnerSelectedReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.prank(creator);
        bounty.selectWinner(id, 0);

        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        vm.expectRevert(ProofBounty.NotOpen.selector);
        bounty.refund(id);
    }

    function test_SelectWinnerAfterReviewWindowReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        vm.expectRevert(ProofBounty.ReviewWindowClosed.selector);
        bounty.selectWinner(id, 0);
    }

    function test_RefundAfterExpiryAndReviewPeriod() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.warp(deadline + REVIEW_PERIOD);
        vm.expectEmit(true, true, false, true, address(bounty));
        emit ProofBounty.BountyRefunded(id, creator, REWARD);
        vm.prank(creator);
        bounty.refund(id);

        assertEq(token.balanceOf(creator), 100e6);
        assertEq(token.balanceOf(address(bounty)), 0);
        (,,,,, ProofBounty.Status status,,) = bounty.bounties(id);
        assertEq(uint8(status), uint8(ProofBounty.Status.Refunded));
    }

    function test_RefundWithoutSubmissionsAfterExpiry() public {
        uint256 id = _create();
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        bounty.refund(id);
        assertEq(token.balanceOf(creator), 100e6);
    }

    function test_RefundBeforeReviewPeriodReverts() public {
        uint256 id = _create();
        _submit(id, worker);

        vm.warp(deadline + REVIEW_PERIOD - 1);
        vm.prank(creator);
        vm.expectRevert(ProofBounty.ReviewPeriodNotOver.selector);
        bounty.refund(id);
    }

    function test_UnauthorizedRefundReverts() public {
        uint256 id = _create();
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(other);
        vm.expectRevert(ProofBounty.NotCreator.selector);
        bounty.refund(id);
    }

    function test_DuplicateRefundReverts() public {
        uint256 id = _create();
        vm.warp(deadline + REVIEW_PERIOD);
        vm.startPrank(creator);
        bounty.refund(id);
        vm.expectRevert(ProofBounty.NotOpen.selector);
        bounty.refund(id);
        vm.stopPrank();
    }

    function test_SubmissionAfterRefundReverts() public {
        uint256 id = _create();
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        bounty.refund(id);

        vm.prank(worker);
        vm.expectRevert(ProofBounty.NotOpen.selector);
        bounty.submitWork(id, EVIDENCE);
    }
}
