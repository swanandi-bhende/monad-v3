// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ProofBounty} from "../src/ProofBounty.sol";

contract DeployProofBounty is Script {
    function run() external returns (ProofBounty bounty) {
        uint64 reviewPeriod = uint64(vm.envOr("REVIEW_PERIOD", uint256(1 days)));

        vm.startBroadcast();
        bounty = new ProofBounty(reviewPeriod);
        vm.stopBroadcast();

        console.log("ProofBounty deployed at", address(bounty));
    }
}
