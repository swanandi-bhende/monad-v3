import type { Address } from "viem";

export type Submission = {
  bountyId: bigint;
  index: number;
  submitter: Address;
  evidence: string;
  submittedAt: number;
};
