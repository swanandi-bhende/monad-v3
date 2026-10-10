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
  const isConfirmed = state.status === "confirmed";
  const isBusy = !isFailed && !isConfirmed;
  const title = isFailed
    ? FAILURE_TITLE[state.errorKind ?? "unknown"]
    : PROGRESS[state.status as keyof typeof PROGRESS];
  const dot = isFailed ? "bg-danger" : isConfirmed ? "bg-status-open" : "bg-accent";

  return (
    <div
      role="status"
      className="fade-in border-line/80 bg-surface flex gap-4 rounded-xl border p-5"
    >
      <span
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${dot} ${isBusy ? "animate-pulse" : ""}`}
      />
      <div className="min-w-0 space-y-1.5">
        <p
          className={`text-body font-medium ${isFailed ? "text-danger" : isConfirmed ? "text-status-open" : "text-ink"}`}
        >
          {label ? `${label}: ` : ""}
          {title}
        </p>
        {isFailed && state.error && <p className="text-caption text-muted">{state.error}</p>}
        {state.hash && (
          <a
            href={txUrl(state.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-ink decoration-accent inline-block font-mono underline decoration-2 underline-offset-4"
          >
            {state.hash.slice(0, 12)}…{state.hash.slice(-6)} ↗ Monadscan
          </a>
        )}
      </div>
    </div>
  );
}
