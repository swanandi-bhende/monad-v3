import type { TransactionState } from "@/types/transaction";
import { txUrl } from "@/lib/blockchain/transaction";

const LABELS: Record<Exclude<TransactionState["status"], "idle">, string> = {
  awaiting_signature: "Waiting for wallet confirmation…",
  pending: "Transaction pending on Monad Testnet…",
  confirmed: "Confirmed on Monad Testnet",
  failed: "Transaction failed",
};

export function TxStatus({ state, label }: { state: TransactionState; label?: string }) {
  if (state.status === "idle") return null;

  const tone =
    state.status === "failed"
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
        {state.status === "pending" || state.status === "awaiting_signature" ? (
          <span className="bg-accent size-1.5 animate-pulse rounded-full" />
        ) : null}
        {label ? `${label}: ` : ""}
        {LABELS[state.status]}
      </p>
      {state.error && <p className="text-caption text-danger mt-1">{state.error}</p>}
      {state.hash && (
        <a
          href={txUrl(state.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-accent mt-2 inline-block font-mono hover:underline"
        >
          {state.hash.slice(0, 12)}…{state.hash.slice(-6)} ↗
        </a>
      )}
    </div>
  );
}
