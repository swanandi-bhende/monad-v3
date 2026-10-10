import type { Address } from "viem";
import type { Submission } from "@/types/submission";

export type BountyStatus = "open" | "under_review" | "completed" | "expired" | "refunded";

export type SelectionMethod = "manual";

export type BountyMetadata = {
  title: string;
  description: string;
  category: string;
  selectionMethod: SelectionMethod;
};

export type Bounty = BountyMetadata & {
  id: bigint;
  creator: Address;
  rewardToken: Address;
  rewardAmount: bigint;
  deadline: number;
  reviewEnd: number;
  status: BountyStatus;
  winner?: Address;
};

export type BountyWithSubmissions = Bounty & { submissions: Submission[] };
