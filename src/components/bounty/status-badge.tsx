import { BOUNTY_STATUS_LABELS } from "@/constants/bounty";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { BountyStatus } from "@/types/bounty";

const TONE: Record<BountyStatus, BadgeTone> = {
  open: "open",
  under_review: "review",
  completed: "completed",
  expired: "expired",
  refunded: "refunded",
};

export function StatusBadge({ status }: { status: BountyStatus }) {
  return <Badge tone={TONE[status]}>{BOUNTY_STATUS_LABELS[status]}</Badge>;
}
