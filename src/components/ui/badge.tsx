import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "open" | "review" | "completed" | "expired" | "refunded";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-raised text-muted",
  open: "bg-status-open-bg text-status-open",
  review: "bg-status-review-bg text-status-review",
  completed: "bg-status-completed-bg text-status-completed",
  expired: "bg-status-expired-bg text-status-expired",
  refunded: "bg-status-refunded-bg text-status-refunded",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`text-caption rounded-pill inline-flex items-center gap-1.5 px-3 py-1 font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
