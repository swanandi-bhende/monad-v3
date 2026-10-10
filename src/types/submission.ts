import type { Address } from "viem";

export type CredibilitySignals = {
  credible: number;
  lowQuality: number;
};

export type Submission = {
  bountyId: bigint;
  index: number;
  submitter: Address;
  reference: string;
  submittedAt: number;
  credibility: CredibilitySignals;
};
