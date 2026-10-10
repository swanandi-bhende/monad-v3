"use client";

import { useNow } from "@/hooks/use-now";
import { formatCountdown } from "@/lib/utils/format";

export function Countdown({ deadline }: { deadline: number }) {
  const now = useNow();
  if (!now) return <span className="text-muted">—</span>;
  return <span>{formatCountdown(deadline - Math.floor(now / 1000))}</span>;
}
