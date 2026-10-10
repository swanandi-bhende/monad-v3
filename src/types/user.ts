import type { Address } from "viem";

export type Reputation = {
  completedBounties: number;
  wins: number;
  totalEarned: bigint;
  successRate: number;
};

export type User = {
  address: Address;
  reputation: Reputation;
};
