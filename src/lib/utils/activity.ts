import { formatReward, shortAddress } from "@/lib/utils/format";
import type { ChainEvent } from "@/types/event";

export function describeEvent(event: ChainEvent) {
  const bounty = `#${event.bountyId}`;
  switch (event.kind) {
    case "created":
      return `Bounty ${bounty} posted: ${event.title ?? "Untitled bounty"}`;
    case "submitted":
      return `Submission received on ${bounty} from ${shortAddress(event.actor)}`;
    case "winner":
      return `Winner selected on ${bounty}. ${formatReward(BigInt(event.amount ?? 0))} paid to ${shortAddress(event.actor)}`;
    case "refunded":
      return `${bounty} refunded to the creator: ${formatReward(BigInt(event.amount ?? 0))}`;
    case "credibility":
      return `${shortAddress(event.actor)} marked a submission on ${bounty} as ${event.signal === "credible" ? "credible" : "low quality"}`;
  }
}
