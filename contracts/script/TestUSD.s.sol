// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TestUSD} from "../src/TestUSD.sol";

contract DeployTestUSD is Script {
    function run() external returns (TestUSD token) {
        vm.startBroadcast();
        token = new TestUSD();
        token.mint(msg.sender, 1_000e6);
        vm.stopBroadcast();

        console.log("TestUSD deployed at", address(token));
    }
}
