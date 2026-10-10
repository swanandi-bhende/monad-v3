import type { BountyStatus, SelectionMethod } from "@/types/bounty";

export const BOUNTY_CATEGORIES = [
  "Development",
  "Design",
  "Research",
  "Security",
  "Content",
  "Other",
];

export const SELECTION_METHODS: { value: SelectionMethod; label: string }[] = [
  { value: "manual", label: "Creator selects winner" },
];

export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  open: "Open",
  under_review: "Under review",
  completed: "Completed",
  expired: "Expired",
  refunded: "Refunded",
};
