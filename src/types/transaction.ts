import type { Hash } from "viem";

export type TransactionStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export type TransactionState = {
  status: TransactionStatus;
  hash?: Hash;
  error?: string;
};
