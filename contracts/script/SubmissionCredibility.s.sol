// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ProofBounty} from "../src/ProofBounty.sol";
import {SubmissionCredibility} from "../src/SubmissionCredibility.sol";

contract DeploySubmissionCredibility is Script {
    function run() external returns (SubmissionCredibility credibility) {
        ProofBounty bounty = ProofBounty(vm.envAddress("PROOFBOUNTY_ADDRESS"));

        vm.startBroadcast();
        credibility = new SubmissionCredibility(bounty);
        vm.stopBroadcast();

        console.log("SubmissionCredibility deployed at", address(credibility));
    }
}
