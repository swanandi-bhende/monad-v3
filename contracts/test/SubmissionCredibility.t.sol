// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ProofBounty} from "../src/ProofBounty.sol";
import {SubmissionCredibility} from "../src/SubmissionCredibility.sol";

contract SubmissionCredibilityTest is Test {
    ProofBounty internal bounty;
    SubmissionCredibility internal credibility;
    ERC20Mock internal token;

    address internal creator = makeAddr("creator");
    address internal workerA = makeAddr("workerA");
    address internal workerB = makeAddr("workerB");
    address internal voter = makeAddr("voter");

    uint256 internal constant REWARD = 5e6;
    uint64 internal deadline;

    function setUp() public {
        bounty = new ProofBounty(1 days);
        credibility = new SubmissionCredibility(bounty);
        token = new ERC20Mock();
        token.mint(creator, 100e6);
        deadline = uint64(block.timestamp + 1 hours);

        vm.startPrank(creator);
        token.approve(address(bounty), type(uint256).max);
        bounty.createBounty(address(token), REWARD, deadline, "{}");
        vm.stopPrank();

        vm.prank(workerA);
        bounty.submitWork(0, "{\"text\":\"A\"}");
        vm.prank(workerB);
        bounty.submitWork(0, "{\"text\":\"B\"}");
    }

    function test_MarkCountsSignal() public {
        vm.prank(voter);
        credibility.mark(0, 0, SubmissionCredibility.Signal.Credible);
        vm.prank(workerB);
        credibility.mark(0, 0, SubmissionCredibility.Signal.LowQuality);

        (uint256 credible, uint256 lowQuality) = credibility.tally(0, 0);
        assertEq(credible, 1);
        assertEq(lowQuality, 1);
        assertEq(uint8(credibility.signalOf(0, 0, voter)), uint8(SubmissionCredibility.Signal.Credible));
    }

    function test_MarkEmitsEvent() public {
        vm.expectEmit(true, true, true, true, address(credibility));
        emit SubmissionCredibility.SignalMarked(0, 1, voter, SubmissionCredibility.Signal.LowQuality);
        vm.prank(voter);
        credibility.mark(0, 1, SubmissionCredibility.Signal.LowQuality);
    }

    function test_OwnSubmissionReverts() public {
        vm.prank(workerA);
        vm.expectRevert(SubmissionCredibility.OwnSubmission.selector);
        credibility.mark(0, 0, SubmissionCredibility.Signal.Credible);
    }

    function test_SecondMarkFromSameWalletReverts() public {
        vm.startPrank(voter);
        credibility.mark(0, 0, SubmissionCredibility.Signal.Credible);
        vm.expectRevert(SubmissionCredibility.AlreadyMarked.selector);
        credibility.mark(0, 0, SubmissionCredibility.Signal.LowQuality);
        vm.stopPrank();
    }

    function test_UnknownSubmissionReverts() public {
        vm.prank(voter);
        vm.expectRevert(SubmissionCredibility.SubmissionNotFound.selector);
        credibility.mark(0, 9, SubmissionCredibility.Signal.Credible);
    }

    function test_NoneSignalReverts() public {
        vm.prank(voter);
        vm.expectRevert(SubmissionCredibility.InvalidSignal.selector);
        credibility.mark(0, 0, SubmissionCredibility.Signal.None);
    }

    function test_CredibilityDoesNotAffectPayout() public {
        vm.prank(voter);
        credibility.mark(0, 1, SubmissionCredibility.Signal.Credible);
        vm.prank(workerA);
        credibility.mark(0, 1, SubmissionCredibility.Signal.LowQuality);

        vm.prank(creator);
        bounty.selectWinner(0, 1);

        assertEq(token.balanceOf(workerB), REWARD);
        assertEq(token.balanceOf(workerA), 0);
    }
}
