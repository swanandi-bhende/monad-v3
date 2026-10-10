import type { Address } from "viem";
import type { Submission } from "@/types/submission";

export type BountyStatus = "open" | "under_review" | "completed" | "expired" | "refunded";

export type SelectionMethod = "manual";

export type RubricCriterion = { name: string; weight: number };

export type BountyMetadata = {
  title: string;
  description: string;
  category: string;
  selectionMethod: SelectionMethod;
  deliverables: string;
  acceptanceCriteria: string;
  submissionInstructions: string;
  tools: string[];
  rubric: RubricCriterion[];
};

export type Bounty = BountyMetadata & {
  id: bigint;
  creator: Address;
  rewardToken: Address;
  rewardAmount: bigint;
  feeAmount: bigint;
  reviewPool: bigint;
  reviewPaid: bigint;
  winnerAmount: bigint;
  deadline: number;
  reviewEnd: number;
  reviewSlots: number;
  reviewCount: number;
  status: BountyStatus;
  winner?: Address;
};

export type BountyWithSubmissions = Bounty & {
  submissions: Submission[];
  scoreTotals: bigint[];
};
