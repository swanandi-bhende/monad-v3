import type { TransactionErrorKind, TransactionState } from "@/types/transaction";
import { txUrl } from "@/lib/blockchain/transaction";

const PROGRESS: Record<"awaiting_signature" | "pending" | "confirmed", string> = {
  awaiting_signature: "Waiting for wallet confirmation…",
  pending: "Pending on Monad Testnet…",
  confirmed: "Confirmed on Monad Testnet",
};

const FAILURE_TITLE: Record<TransactionErrorKind, string> = {
  rejected: "Rejected in wallet",
  insufficient_funds: "Insufficient balance",
  wrong_network: "Wrong network",
  contract_revert: "Contract rejected the transaction",
  rpc: "RPC error",
  unknown: "Transaction failed",
};

export function TxStatus({ state, label }: { state: TransactionState; label?: string }) {
  if (state.status === "idle") return null;

  const isFailed = state.status === "failed";
  const title = isFailed
    ? FAILURE_TITLE[state.errorKind ?? "unknown"]
    : PROGRESS[state.status as keyof typeof PROGRESS];
  const tone = isFailed
    ? "text-danger"
    : state.status === "confirmed"
      ? "text-status-open"
      : "text-muted";

  return (
    <div
      role="status"
      className="fade-in border-line bg-surface-raised rounded-md border px-4 py-3"
    >
      <p className={`text-caption flex items-center gap-2 font-medium ${tone}`}>
        {!isFailed && state.status !== "confirmed" && (
          <span className="bg-accent size-1.5 animate-pulse rounded-full" />
        )}
        {label ? `${label}: ` : ""}
        {title}
      </p>
      {isFailed && state.error && <p className="text-caption text-danger mt-1">{state.error}</p>}
      {state.hash && (
        <a
          href={txUrl(state.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-accent mt-2 inline-block font-mono hover:underline"
        >
          {state.hash.slice(0, 12)}…{state.hash.slice(-6)} ↗ Monadscan
        </a>
      )}
    </div>
  );
}
