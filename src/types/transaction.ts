import type { Hash } from "viem";

type TransactionStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export type TransactionErrorKind =
  "rejected" | "insufficient_funds" | "wrong_network" | "contract_revert" | "rpc" | "unknown";

export type TransactionState = {
  status: TransactionStatus;
  hash?: Hash;
  error?: string;
  errorKind?: TransactionErrorKind;
};
