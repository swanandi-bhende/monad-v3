import type { Address } from "viem";
import type { ChainEvent } from "@/types/event";

export type Credibility = { credible: number; lowQuality: number };

function signalsFor(events: ChainEvent[], bountyId: bigint, submissionIndex: number) {
  return events.filter(
    (event) =>
      event.kind === "credibility" &&
      event.bountyId === Number(bountyId) &&
      event.submissionIndex === submissionIndex,
  );
}

export function credibilityFor(
  events: ChainEvent[],
  bountyId: bigint,
  submissionIndex: number,
): Credibility {
  const signals = signalsFor(events, bountyId, submissionIndex);
  return {
    credible: signals.filter((event) => event.signal === "credible").length,
    lowQuality: signals.filter((event) => event.signal === "low_quality").length,
  };
}

export function viewerSignal(
  events: ChainEvent[],
  bountyId: bigint,
  submissionIndex: number,
  viewer: Address | undefined,
) {
  if (!viewer) return undefined;
  return signalsFor(events, bountyId, submissionIndex).find(
    (event) => event.actor.toLowerCase() === viewer.toLowerCase(),
  )?.signal;
}
