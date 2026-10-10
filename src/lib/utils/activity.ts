import { formatReward, shortAddress } from "@/lib/utils/format";
import type { ChainEvent } from "@/types/event";

export function describeEvent(event: ChainEvent) {
  const bounty = `#${event.bountyId}`;
  switch (event.kind) {
    case "created":
      return `Bounty ${bounty} posted: ${event.title ?? "Untitled bounty"}`;
    case "submitted":
      return `Work submitted to ${bounty} by ${shortAddress(event.actor)}`;
    case "reviewed":
      return `Review submitted on ${bounty} by ${shortAddress(event.actor)}. ${formatReward(BigInt(event.amount ?? 0))} review reward paid`;
    case "winner":
      return `Winner selected on ${bounty}. ${formatReward(BigInt(event.amount ?? 0))} paid to ${shortAddress(event.actor)}`;
    case "refunded":
      return `${bounty} refunded to the creator: ${formatReward(BigInt(event.amount ?? 0))}`;
  }
}
