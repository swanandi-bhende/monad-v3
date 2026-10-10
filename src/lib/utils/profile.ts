import type { Address } from "viem";
import { credibilityFor } from "@/lib/utils/credibility";
import type { BountyWithSubmissions } from "@/types/bounty";
import type { ChainEvent } from "@/types/event";

export function sameAddress(a: string | undefined, b: string | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function computeProfile(
  bounties: BountyWithSubmissions[],
  events: ChainEvent[],
  address: Address,
) {
  const posted = bounties.filter((b) => sameAddress(b.creator, address));
  const submitted = bounties.filter((b) =>
    b.submissions.some((s) => sameAddress(s.submitter, address)),
  );
  const completedWork = submitted.filter((b) => b.status === "completed");

  const work = events
    .filter((event) => event.kind === "winner" && sameAddress(event.actor, address))
    .map((event) => ({
      event,
      bounty: bounties.find((b) => Number(b.id) === event.bountyId),
      reward: BigInt(event.amount ?? 0),
    }))
    .filter(
      (item): item is { event: ChainEvent; bounty: BountyWithSubmissions; reward: bigint } =>
        !!item.bounty,
    )
    .sort((a, b) => b.event.timestamp - a.event.timestamp);

  const totalEarned = work.reduce((sum, item) => sum + item.reward, BigInt(0));

  const received = bounties.reduce(
    (totals, bounty) => {
      bounty.submissions
        .filter((submission) => sameAddress(submission.submitter, address))
        .forEach((submission) => {
          const signals = credibilityFor(events, bounty.id, submission.index);
          totals.credible += signals.credible;
          totals.lowQuality += signals.lowQuality;
        });
      return totals;
    },
    { credible: 0, lowQuality: 0 },
  );

  return { posted, submitted, completedWork, work, totalEarned, received };
}

export function submissionsBy(bounties: BountyWithSubmissions[], address: Address) {
  return bounties.flatMap((bounty) =>
    bounty.submissions
      .filter((submission) => sameAddress(submission.submitter, address))
      .map((submission) => ({ bounty, submission })),
  );
}
