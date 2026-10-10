import type { Address } from "viem";
import type { BountyWithSubmissions } from "@/types/bounty";
import type { ChainEvent } from "@/types/event";

export function sameAddress(a: string | undefined, b: string | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function submissionsBy(bounties: BountyWithSubmissions[], address: Address) {
  return bounties.flatMap((bounty) =>
    bounty.submissions
      .filter((submission) => sameAddress(submission.submitter, address))
      .map((submission) => ({ bounty, submission })),
  );
}

export function computeReputation(
  bounties: BountyWithSubmissions[],
  events: ChainEvent[],
  address: Address,
) {
  const posted = bounties.filter((b) => sameAddress(b.creator, address));
  const submitted = submissionsBy(bounties, address);
  const completedSubmitted = submitted.filter(({ bounty }) => bounty.status === "completed");

  const wins = events
    .filter((event) => event.kind === "winner" && sameAddress(event.actor, address))
    .map((event) => ({
      event,
      bounty: bounties.find((b) => Number(b.id) === event.bountyId),
      amount: BigInt(event.amount ?? 0),
    }))
    .filter(
      (item): item is { event: ChainEvent; bounty: BountyWithSubmissions; amount: bigint } =>
        !!item.bounty,
    )
    .sort((a, b) => b.event.timestamp - a.event.timestamp);

  const reviews = events
    .filter((event) => event.kind === "reviewed" && sameAddress(event.actor, address))
    .sort((a, b) => b.timestamp - a.timestamp);

  const workEarned = wins.reduce((sum, item) => sum + item.amount, BigInt(0));
  const reviewEarned = reviews.reduce((sum, event) => sum + BigInt(event.amount ?? 0), BigInt(0));

  return {
    posted,
    submitted,
    completedSubmitted,
    wins,
    reviews,
    workEarned,
    reviewEarned,
    totalEarned: workEarned + reviewEarned,
  };
}
