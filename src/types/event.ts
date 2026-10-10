import type { Address, Hash } from "viem";

export type ChainEvent = {
  kind: "created" | "submitted" | "winner" | "refunded" | "credibility";
  bountyId: number;
  actor: Address;
  submissionIndex?: number;
  amount?: string;
  title?: string;
  signal?: "credible" | "low_quality";
  txHash: Hash;
  blockNumber: number;
  logIndex: number;
  timestamp: number;
};
