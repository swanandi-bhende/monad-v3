// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TestUSDC} from "../src/TestUSDC.sol";
import {GigAChad} from "../src/GigAChad.sol";

contract GigAChadTest is Test {
    GigAChad internal gig;
    TestUSDC internal usdc;

    address internal treasury = makeAddr("treasury");
    address internal creator = makeAddr("creator");
    address internal workerA = makeAddr("workerA");
    address internal workerB = makeAddr("workerB");
    address internal reviewer1 = makeAddr("reviewer1");
    address internal reviewer2 = makeAddr("reviewer2");
    address internal reviewer3 = makeAddr("reviewer3");

    uint64 internal constant REVIEW_PERIOD = 1 days;
    uint256 internal constant REWARD = 10e6;
    string internal constant META = "{\"title\":\"Landing page\"}";

    uint64 internal deadline;

    function setUp() public {
        gig = new GigAChad(treasury, REVIEW_PERIOD);
        usdc = new TestUSDC();
        usdc.mint(creator, 1_000e6);
        usdc.mint(workerA, 1e6);
        usdc.mint(workerB, 1e6);
        deadline = uint64(block.timestamp + 1 hours);
        vm.prank(creator);
        usdc.approve(address(gig), type(uint256).max);
    }

    function _create(uint256 reward, uint8 slots) internal returns (uint256 id) {
        vm.prank(creator);
        id = gig.createBounty(address(usdc), reward, deadline, slots, META);
    }

    function _submitBoth() internal {
        vm.prank(workerA);
        gig.submitWork(0, "{\"text\":\"A\"}");
        vm.prank(workerB);
        gig.submitWork(0, "{\"text\":\"B\"}");
    }

    function _scores(uint8 a, uint8 b) internal pure returns (uint8[] memory s) {
        s = new uint8[](2);
        s[0] = a;
        s[1] = b;
    }

    function _reviewWindow() internal {
        vm.warp(deadline + 1);
    }

    function test_FeeTiers() public view {
        assertEq(gig.feeBps(10e6), 500);
        assertEq(gig.feeBps(49_999_999), 500);
        assertEq(gig.feeBps(50e6), 400);
        assertEq(gig.feeBps(500e6), 400);
        assertEq(gig.feeBps(500_000_001), 300);
    }

    function test_CreateSplitsRewardTransparently() public {
        uint256 id = _create(REWARD, 3);
        (,, uint256 reward, uint256 fee, uint256 pool, uint256 paid, uint256 winner,,, uint8 slots,,,,) =
            gig.bounties(id);
        assertEq(reward, 10e6);
        assertEq(fee, 0.5e6);
        assertEq(pool, 1e6);
        assertEq(paid, 0);
        assertEq(winner, 8.5e6);
        assertEq(slots, 3);
        assertEq(usdc.balanceOf(address(gig)), 10e6);
    }

    function test_CreateRevertsOnInvalidInput() public {
        vm.startPrank(creator);
        vm.expectRevert(GigAChad.InvalidReward.selector);
        gig.createBounty(address(usdc), 0, deadline, 1, META);
        vm.expectRevert(GigAChad.InvalidReviewSlots.selector);
        gig.createBounty(address(usdc), REWARD, deadline, 0, META);
        vm.expectRevert(GigAChad.InvalidReviewSlots.selector);
        gig.createBounty(address(usdc), REWARD, deadline, 11, META);
        vm.expectRevert(GigAChad.InvalidReward.selector);
        gig.createBounty(address(usdc), 5, deadline, 2, META);
        vm.expectRevert(GigAChad.InvalidDeadline.selector);
        gig.createBounty(address(usdc), REWARD, uint64(block.timestamp), 1, META);
        vm.stopPrank();
    }

    function test_SubmitRecordsAndRules() public {
        _create(REWARD, 2);
        vm.prank(workerA);
        gig.submitWork(0, "{\"text\":\"A\"}");
        assertEq(gig.getSubmissions(0).length, 1);

        vm.prank(creator);
        vm.expectRevert(GigAChad.CreatorCannotSubmit.selector);
        gig.submitWork(0, "x");

        vm.prank(workerB);
        vm.expectRevert(GigAChad.EmptyEvidence.selector);
        gig.submitWork(0, "");

        vm.warp(deadline + 1);
        vm.prank(workerB);
        vm.expectRevert(GigAChad.SubmissionWindowClosed.selector);
        gig.submitWork(0, "late");
    }

    function test_ReviewRequiresReviewWindow() public {
        _create(REWARD, 2);
        _submitBoth();
        vm.prank(reviewer1);
        vm.expectRevert(GigAChad.ReviewWindowNotOpen.selector);
        gig.submitReview(0, _scores(80, 90), "{}");

        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(reviewer1);
        vm.expectRevert(GigAChad.ReviewWindowClosed.selector);
        gig.submitReview(0, _scores(80, 90), "{}");
    }

    function test_ReviewPaysReviewerAndStoresScores() public {
        _create(REWARD, 2);
        _submitBoth();
        _reviewWindow();
        vm.prank(reviewer1);
        gig.submitReview(0, _scores(80, 90), "{\"feedback\":\"clean\"}");

        assertEq(usdc.balanceOf(reviewer1), 0.5e6);
        uint256[] memory totals = gig.getScoreTotals(0);
        assertEq(totals[0], 80);
        assertEq(totals[1], 90);
        assertTrue(gig.hasReviewed(0, reviewer1));
        (,,,,, uint256 paid,,,,, uint8 count,,,) = gig.bounties(0);
        assertEq(paid, 0.5e6);
        assertEq(count, 1);
    }

    function test_ReviewRules() public {
        _create(REWARD, 1);
        _submitBoth();
        _reviewWindow();

        vm.prank(creator);
        vm.expectRevert(GigAChad.CreatorCannotReview.selector);
        gig.submitReview(0, _scores(1, 1), "{}");

        vm.prank(workerA);
        vm.expectRevert(GigAChad.ConflictOfInterest.selector);
        gig.submitReview(0, _scores(1, 1), "{}");

        vm.prank(reviewer1);
        vm.expectRevert(GigAChad.ScoreCountMismatch.selector);
        uint8[] memory one = new uint8[](1);
        gig.submitReview(0, one, "{}");

        uint8[] memory bad = new uint8[](2);
        bad[0] = 101;
        vm.prank(reviewer1);
        vm.expectRevert(GigAChad.InvalidScore.selector);
        gig.submitReview(0, bad, "{}");

        vm.prank(reviewer1);
        gig.submitReview(0, _scores(70, 60), "{}");

        vm.prank(reviewer1);
        vm.expectRevert(GigAChad.AlreadyReviewed.selector);
        gig.submitReview(0, _scores(70, 60), "{}");

        vm.prank(reviewer2);
        vm.expectRevert(GigAChad.ReviewSlotsFull.selector);
        gig.submitReview(0, _scores(70, 60), "{}");
    }

    function test_SelectWinnerPaysWinnerFeeAndLeftoverPool() public {
        _create(REWARD, 3);
        _submitBoth();
        _reviewWindow();
        vm.prank(reviewer1);
        gig.submitReview(0, _scores(70, 90), "{}");

        vm.warp(deadline + 1);
        vm.prank(creator);
        gig.selectWinner(0, 1);

        assertEq(usdc.balanceOf(workerB), 1e6 + 8.5e6);
        assertEq(usdc.balanceOf(treasury), 0.5e6);
        assertEq(usdc.balanceOf(reviewer1), uint256(1e6) / 3);
        assertEq(usdc.balanceOf(creator), 1_000e6 - 10e6 + (uint256(1e6) - uint256(1e6) / 3));
        assertEq(usdc.balanceOf(address(gig)), 0);
        (,,,,,,,,,,, GigAChad.Status status, address winner,) = gig.bounties(0);
        assertEq(uint8(status), uint8(GigAChad.Status.Completed));
        assertEq(winner, workerB);
    }

    function test_SelectWinnerRules() public {
        _create(REWARD, 2);
        _submitBoth();
        vm.warp(deadline);
        vm.prank(creator);
        vm.expectRevert(GigAChad.SubmissionWindowOpen.selector);
        gig.selectWinner(0, 0);

        vm.warp(deadline + 1);
        vm.prank(workerA);
        vm.expectRevert(GigAChad.NotCreator.selector);
        gig.selectWinner(0, 0);

        vm.prank(creator);
        vm.expectRevert(GigAChad.InvalidSubmissionIndex.selector);
        gig.selectWinner(0, 5);

        vm.prank(creator);
        gig.selectWinner(0, 0);

        vm.prank(creator);
        vm.expectRevert(GigAChad.NotOpen.selector);
        gig.selectWinner(0, 0);

        vm.prank(creator);
        vm.expectRevert(GigAChad.NotOpen.selector);
        gig.refund(0);
    }

    function test_SelectAfterReviewWindowReverts() public {
        _create(REWARD, 1);
        _submitBoth();
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        vm.expectRevert(GigAChad.ReviewWindowClosed.selector);
        gig.selectWinner(0, 0);
    }

    function test_RefundBeforeReviewPeriodReverts() public {
        _create(REWARD, 2);
        _submitBoth();
        vm.warp(deadline + REVIEW_PERIOD - 1);
        vm.prank(creator);
        vm.expectRevert(GigAChad.ReviewPeriodNotOver.selector);
        gig.refund(0);
    }

    function test_RefundReturnsEscrowWhenUnresolved() public {
        _create(REWARD, 2);
        _submitBoth();
        vm.warp(deadline + 1);
        vm.prank(reviewer1);
        gig.submitReview(0, _scores(50, 50), "{}");

        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        gig.refund(0);

        assertEq(usdc.balanceOf(creator), 1_000e6 - 10e6 + (10e6 - 0.5e6));
        assertEq(usdc.balanceOf(treasury), 0);
        assertEq(usdc.balanceOf(reviewer1), 0.5e6);
        (,,,,,,,,,,, GigAChad.Status status,,) = gig.bounties(0);
        assertEq(uint8(status), uint8(GigAChad.Status.Refunded));
    }

    function test_RefundTwiceReverts() public {
        _create(REWARD, 1);
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        gig.refund(0);
        vm.prank(creator);
        vm.expectRevert(GigAChad.NotOpen.selector);
        gig.refund(0);
    }

    function test_RefundByNonCreatorReverts() public {
        _create(REWARD, 1);
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(workerA);
        vm.expectRevert(GigAChad.NotCreator.selector);
        gig.refund(0);
    }

    function test_SubmitAfterRefundReverts() public {
        _create(REWARD, 1);
        vm.warp(deadline + REVIEW_PERIOD);
        vm.prank(creator);
        gig.refund(0);
        vm.prank(workerA);
        vm.expectRevert(GigAChad.NotOpen.selector);
        gig.submitWork(0, "late");
    }

    function test_UnknownBountyReverts() public {
        vm.prank(workerA);
        vm.expectRevert(GigAChad.BountyNotFound.selector);
        gig.submitWork(9, "x");
    }

    function test_ConstructorRejectsBadConfig() public {
        vm.expectRevert(GigAChad.InvalidTreasury.selector);
        new GigAChad(address(0), 1);
        vm.expectRevert(GigAChad.InvalidReviewPeriod.selector);
        new GigAChad(treasury, 0);
    }

    function test_FullLifecycleConservesFunds() public {
        _create(REWARD, 2);
        _submitBoth();
        _reviewWindow();
        vm.prank(reviewer1);
        gig.submitReview(0, _scores(90, 40), "{}");
        vm.prank(reviewer2);
        gig.submitReview(0, _scores(85, 45), "{}");

        vm.warp(deadline + 2);
        vm.prank(creator);
        gig.selectWinner(0, 0);

        uint256 total = usdc.balanceOf(workerA) + usdc.balanceOf(workerB) + usdc.balanceOf(treasury)
            + usdc.balanceOf(reviewer1) + usdc.balanceOf(reviewer2) + usdc.balanceOf(creator)
            + usdc.balanceOf(address(gig));
        assertEq(total, 1e6 + 1e6 + 1_000e6);
        assertEq(usdc.balanceOf(address(gig)), 0);
        assertEq(usdc.balanceOf(workerA), 1e6 + 8.5e6);
    }
}
