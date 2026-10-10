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
      className={`text-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
