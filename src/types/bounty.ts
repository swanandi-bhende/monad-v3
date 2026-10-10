import type { Address } from "viem";

export type BountyStatus = "open" | "under_review" | "completed" | "expired" | "refunded";

export type SelectionMethod = "manual" | "rule_based";

export type Bounty = {
  id: bigint;
  creator: Address;
  title: string;
  description: string;
  category: string;
  rewardToken: Address;
  rewardAmount: bigint;
  deadline: number;
  selectionMethod: SelectionMethod;
  status: BountyStatus;
  submissionCount: number;
  winner?: Address;
};
