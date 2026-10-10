import type { Address } from "viem";
import type { BountyWithSubmissions } from "@/types/bounty";
import type { Submission } from "@/types/submission";

const FINISHED = ["completed", "expired", "refunded"];

export function sameAddress(a: string | undefined, b: string | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function computeProfile(bounties: BountyWithSubmissions[], address: Address) {
  const posted = bounties.filter((b) => sameAddress(b.creator, address));
  const submitted = bounties.filter((b) =>
    b.submissions.some((s) => sameAddress(s.submitter, address)),
  );
  const won = bounties.filter((b) => sameAddress(b.winner, address));
  const completedWork = submitted.filter((b) => b.status === "completed");
  const finished = submitted.filter((b) => FINISHED.includes(b.status));
  const totalEarned = won.reduce((sum, b) => sum + b.rewardAmount, BigInt(0));
  const successRate = finished.length ? won.length / finished.length : 0;

  return { posted, submitted, won, completedWork, totalEarned, successRate };
}

export function recentSubmissions(bounties: BountyWithSubmissions[], limit: number) {
  return bounties
    .flatMap((bounty) => bounty.submissions.map((submission) => ({ bounty, submission })))
    .sort((a, b) => b.submission.submittedAt - a.submission.submittedAt)
    .slice(0, limit);
}

export function submissionsBy(bounties: BountyWithSubmissions[], address: Address) {
  return bounties.flatMap((bounty) =>
    bounty.submissions
      .filter((submission: Submission) => sameAddress(submission.submitter, address))
      .map((submission) => ({ bounty, submission })),
  );
}
