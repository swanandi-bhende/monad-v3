import type { Address, Hash } from "viem";

export type ChainEvent = {
  kind: "created" | "submitted" | "reviewed" | "winner" | "refunded";
  bountyId: number;
  actor: Address;
  submissionIndex?: number;
  amount?: string;
  fee?: string;
  title?: string;
  feedback?: string;
  reviewNumber?: number;
  txHash: Hash;
  blockNumber: number;
  logIndex: number;
  timestamp: number;
};
