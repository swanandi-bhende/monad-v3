// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUSDC is ERC20 {
    uint256 public constant CLAIM_AMOUNT = 100e6;
    uint256 public constant CLAIM_COOLDOWN = 1 days;

    mapping(address => uint256) public lastClaimAt;

    error ClaimTooSoon(uint256 availableAt);

    constructor() ERC20("Test USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function claim() external {
        uint256 availableAt = lastClaimAt[msg.sender] + CLAIM_COOLDOWN;
        if (lastClaimAt[msg.sender] != 0 && block.timestamp < availableAt) revert ClaimTooSoon(availableAt);
        lastClaimAt[msg.sender] = block.timestamp;
        _mint(msg.sender, CLAIM_AMOUNT);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
