// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TestUSDC} from "../src/TestUSDC.sol";
import {GigAChad} from "../src/GigAChad.sol";

contract DeployGigAChad is Script {
    function run() external returns (TestUSDC usdc, GigAChad gig) {
        uint64 reviewPeriod = uint64(vm.envOr("REVIEW_PERIOD", uint256(600)));

        vm.startBroadcast();
        usdc = new TestUSDC();
        gig = new GigAChad(msg.sender, reviewPeriod);
        vm.stopBroadcast();

        console.log("TestUSDC deployed at", address(usdc));
        console.log("GigAChad deployed at", address(gig));
    }
}
