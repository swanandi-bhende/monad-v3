"use client";

import Link from "next/link";
import { useState } from "react";
import { SubmissionCard } from "@/components/submission/submission-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { inputClass } from "@/components/ui/field";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TxStatus } from "@/components/ui/tx-status";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounty, useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { submitReview } from "@/lib/blockchain/write";
import { reviewerRewardPerSlot } from "@/lib/config/economics";
import { formatReward } from "@/lib/utils/format";
import { decodeEvidence, LINK_KIND_LABEL } from "@/lib/utils/evidence";
import { sameAddress } from "@/lib/utils/profile";
import { weightedScore } from "@/lib/utils/review";
import type { RubricCriterion } from "@/types/bounty";

export function ReviewWorkspace({ id }: { id: bigint }) {
  const query = useBounty(id);
  const events = useChainEvents();
  const { address, isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const refresh = useRefreshBounties();
  const tx = useTransaction();
  const [marks, setMarks] = useState<Record<number, number[]>>({});
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (query.isPending) return <LoadingState label="Loading the submissions for review…" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const bounty = query.data;
  const criteria: RubricCriterion[] = bounty.rubric;

  const isCreator = sameAddress(address, bounty.creator);
  const isSubmitter = bounty.submissions.some((s) => sameAddress(s.submitter, address));
  const alreadyReviewed = (events.data ?? []).some(
    (e) => e.kind === "reviewed" && e.bountyId === Number(id) && sameAddress(e.actor, address),
  );
  const reviewOpen = bounty.status === "under_review";
  const slotsOpen = bounty.reviewCount < bounty.reviewSlots;
  const reward = reviewerRewardPerSlot(bounty.reviewPool, bounty.reviewSlots);
  const confirmed = tx.state.status === "confirmed";
  const pending = tx.state.status === "awaiting_signature" || tx.state.status === "pending";

  let blocker: string | null = null;
  if (!isConnected) blocker = "Connect a wallet to review this work.";
  else if (isCreator) blocker = "The creator cannot review their own bounty.";
  else if (isSubmitter) blocker = "Submitters cannot review the bounty they entered.";
  else if (alreadyReviewed) blocker = "You already reviewed this bounty.";
  else if (!reviewOpen)
    blocker = "Reviews open after the submission deadline and close at the review end.";
  else if (!slotsOpen) blocker = "All review slots are filled.";

  function setMark(submissionIndex: number, criterionIndex: number, value: number) {
    setMarks((current) => {
      const row = [...(current[submissionIndex] ?? criteria.map(() => 0))];
      row[criterionIndex] = value;
      return { ...current, [submissionIndex]: row };
    });
  }

  const overall = bounty.submissions.map(
    (_, index) => weightedScore(criteria, marks[index] ?? []) * 10,
  );

  async function onSubmit() {
    setError(null);
    if (bounty.submissions.some((_, index) => !marks[index])) {
      return setError("Score every submission on each rubric criterion before you submit.");
    }
    const receipt = await tx.execute(() =>
      submitReview(
        id,
        overall,
        JSON.stringify({
          feedback: feedback.trim(),
          criteria: criteria.map((c) => c.name),
          marks: bounty.submissions.map((_, index) => marks[index]),
        }),
      ),
    );
    if (receipt) refresh();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <section className="space-y-10">
        <div className="space-y-4">
          <Link href="/review" className="text-caption text-muted hover:text-ink">
            ← Review &amp; earn
          </Link>
          <p className="text-caption text-muted">
            #{bounty.id.toString()} · {bounty.category}
          </p>
          <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-tight tracking-tight">
            {bounty.title}
          </h1>
          <p className="text-body text-muted whitespace-pre-wrap">{bounty.description}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <p className="text-caption text-muted tracking-wider uppercase">Deliverables</p>
            <p className="text-body mt-3 whitespace-pre-wrap">
              {bounty.deliverables || "Not specified"}
            </p>
          </Card>
          <Card>
            <p className="text-caption text-muted tracking-wider uppercase">Acceptance</p>
            <p className="text-body mt-3 whitespace-pre-wrap">
              {bounty.acceptanceCriteria || "Not specified"}
            </p>
          </Card>
          <Card>
            <p className="text-caption text-muted tracking-wider uppercase">
              Submission instructions
            </p>
            <p className="text-body mt-3 whitespace-pre-wrap">
              {bounty.submissionInstructions || "Not specified"}
            </p>
          </Card>
        </div>

        <section className="space-y-6">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">
            Submissions to score
          </h2>
          {bounty.submissions.length === 0 && (
            <p className="text-body text-muted">No submissions yet.</p>
          )}
          {bounty.submissions.map((submission, index) => {
            const evidence = decodeEvidence(submission.evidence);
            return (
              <div key={submission.index} className="space-y-4">
                <SubmissionCard
                  submission={submission}
                  isWinner={false}
                  reviewCount={bounty.reviewCount}
                  totalScore={bounty.scoreTotals[index] ?? BigInt(0)}
                />
                {reviewOpen && !blocker && (
                  <Card className="space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-2xl">
                        Score: {evidence.text.slice(0, 36)}
                        {evidence.text.length > 36 ? "…" : ""}
                      </p>
                      <p className="font-mono text-lg">
                        {overall[index]} <span className="text-caption text-muted">/100</span>
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {criteria.map((criterion, c) => (
                        <label key={criterion.name} className="space-y-2">
                          <span className="text-body flex justify-between">
                            <span>{criterion.name}</span>
                            <span className="text-caption text-muted">{criterion.weight}%</span>
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            aria-label={`${criterion.name} score for submission ${index + 1}`}
                            className={`${inputClass} font-mono`}
                            value={marks[index]?.[c] ?? ""}
                            placeholder="0–10"
                            onChange={(e) =>
                              setMark(index, c, Math.min(10, Math.max(0, Number(e.target.value))))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            );
          })}
        </section>
      </section>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <Card className="space-y-6">
          <div>
            <p className="text-caption text-muted tracking-wider uppercase">Your review reward</p>
            <p className="font-display mt-2 text-5xl leading-none">{formatReward(reward)}</p>
            <p className="text-caption text-muted mt-3">
              {bounty.reviewCount} of {bounty.reviewSlots} reviews completed
            </p>
          </div>
          {confirmed && (
            <p className="text-body font-medium">
              {formatReward(reward)} earned. It is in your wallet.
            </p>
          )}
          {pending && (
            <p className="text-body text-muted">Reward pending confirmation on Monad Testnet.</p>
          )}
          {!confirmed && !pending && alreadyReviewed && (
            <p className="text-body text-muted">
              Evaluation submitted. The reward was paid when it confirmed.
            </p>
          )}

          {!isConnected ? (
            <ConnectPrompt message="Connect a wallet to review this work." />
          ) : blocker && !(confirmed || pending) ? (
            <p className="text-body text-muted">{blocker}</p>
          ) : isWrongNetwork ? (
            <Button onClick={switchToMonadTestnet} disabled={isSwitching} className="w-full">
              Switch to Monad Testnet
            </Button>
          ) : (
            !blocker && (
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-body font-medium">Written feedback</span>
                  <textarea
                    rows={5}
                    className={inputClass}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What worked, what did not, and why the scores are what they are."
                    disabled={pending}
                  />
                </label>
                <Button className="w-full py-3.5" onClick={onSubmit} disabled={pending}>
                  {pending ? "Submitting…" : "Submit evaluation"}
                </Button>
              </div>
            )
          )}
          {error && <p className="text-caption text-danger">{error}</p>}
          <TxStatus state={tx.state} label="Submit evaluation" />
          {confirmed && (
            <p className="text-caption text-muted">
              Your evaluation is recorded on-chain. Scores appear next to the submissions as they
              arrive.
            </p>
          )}
        </Card>
        <Card className="space-y-3">
          <p className="text-caption text-muted tracking-wider uppercase">Rubric</p>
          {criteria.map((criterion) => (
            <div key={criterion.name} className="text-body flex justify-between">
              <span>{criterion.name}</span>
              <span className="font-mono">{criterion.weight}%</span>
            </div>
          ))}
          <p className="text-caption text-muted">
            Score each criterion 0–10. The overall score is the weighted average, out of 100.
          </p>
        </Card>
        {bounty.submissions.length > 0 && (
          <Card className="space-y-2">
            <p className="text-caption text-muted tracking-wider uppercase">Links to check</p>
            {bounty.submissions.map((submission) => {
              const evidence = decodeEvidence(submission.evidence);
              return evidence.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-caption decoration-accent block truncate underline decoration-2 underline-offset-4"
                >
                  {LINK_KIND_LABEL[link.kind]}: {link.url}
                </a>
              ));
            })}
          </Card>
        )}
      </aside>
    </div>
  );
}
