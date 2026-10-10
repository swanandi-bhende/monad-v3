"use client";

import Link from "next/link";
import { EconomicsPanel } from "@/components/bounty/economics-panel";
import { Countdown } from "@/components/bounty/countdown";
import { StatusBadge } from "@/components/bounty/status-badge";
import { SubmitWorkForm } from "@/components/forms/submit-work-form";
import { SubmissionCard } from "@/components/submission/submission-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TxStatus } from "@/components/ui/tx-status";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounty, useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { addressUrl, txUrl } from "@/lib/blockchain/transaction";
import { refundBounty, selectWinner } from "@/lib/blockchain/write";
import { formatAmount, formatDateTime, formatReward, shortAddress } from "@/lib/utils/format";
import { averageScore } from "@/lib/utils/review";
import { sameAddress } from "@/lib/utils/profile";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import type { ChainEvent } from "@/types/event";
import type { Hash } from "viem";

function money(amount: bigint) {
  return formatAmount(amount, REWARD_TOKEN.decimals, REWARD_TOKEN.symbol);
}

function feedbackText(raw: string | undefined) {
  if (!raw) return "";
  try {
    return (JSON.parse(raw) as { feedback?: string }).feedback ?? "";
  } catch {
    return raw;
  }
}

export function BountyDetail({ id }: { id: bigint }) {
  const query = useBounty(id);
  const events = useChainEvents();
  const { address, isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const refresh = useRefreshBounties();
  const selectTx = useTransaction();
  const refundTx = useTransaction();

  if (query.isPending) return <LoadingState label="Loading bounty…" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const bounty = query.data;

  const eventList: ChainEvent[] = events.data ?? [];
  const bountyEvents = eventList.filter((e) => e.bountyId === Number(id));
  const winnerEvent = bountyEvents.find((e) => e.kind === "winner");
  const refundEvent = bountyEvents.find((e) => e.kind === "refunded");
  const reviews = bountyEvents
    .filter((e) => e.kind === "reviewed")
    .sort((a, b) => a.timestamp - b.timestamp);

  const isCreator = sameAddress(address, bounty.creator);
  const busy = [selectTx, refundTx].some(
    (t) => t.state.status === "awaiting_signature" || t.state.status === "pending",
  );
  const canSelect = isCreator && bounty.status === "under_review";
  const canRefund = isCreator && bounty.status === "expired";
  const canSubmit = bounty.status === "open" && !isCreator;

  const settlementHash: Hash | undefined =
    bounty.status === "completed"
      ? (winnerEvent?.txHash ?? selectTx.state.hash)
      : bounty.status === "refunded"
        ? (refundEvent?.txHash ?? refundTx.state.hash)
        : undefined;

  const ranked = bounty.submissions
    .map((submission, index) => ({
      submission,
      index,
      average: averageScore(bounty.scoreTotals[index] ?? BigInt(0), bounty.reviewCount),
    }))
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  const reviewerTotal = bounty.reviewPaid;

  async function onSelect(index: number) {
    const receipt = await selectTx.execute(() => selectWinner(id, index));
    if (receipt) refresh();
  }

  async function onRefund() {
    const receipt = await refundTx.execute(() => refundBounty(id));
    if (receipt) refresh();
  }

  return (
    <div className="fade-in grid gap-10 lg:grid-cols-[1fr_360px]">
      <section className="space-y-12">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={bounty.status} />
            <span className="text-caption text-muted">
              #{bounty.id.toString()} · {bounty.category}
            </span>
          </div>
          <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] tracking-tight">
            {bounty.title}
          </h1>
          <p className="text-body text-muted max-w-2xl text-lg whitespace-pre-wrap">
            {bounty.description}
          </p>
        </div>

        {bounty.status === "open" && (
          <Card className="space-y-2">
            <p className="text-caption text-muted tracking-wider uppercase">Next step</p>
            <p className="text-body">
              Submissions close at the deadline. Then reviewers score the work and the creator
              selects a winner.
            </p>
          </Card>
        )}

        {bounty.status === "under_review" && (
          <Card className="space-y-3">
            <p className="text-caption text-muted tracking-wider uppercase">Under review</p>
            <p className="text-body">
              Submissions are closed. Reviews are open until {formatDateTime(bounty.reviewEnd)}. The
              creator can select a winner until then.
            </p>
            <Link href={`/review/${bounty.id}`}>
              <Button variant="secondary">
                Review this work <span aria-hidden>→</span>
              </Button>
            </Link>
          </Card>
        )}

        {bounty.status === "completed" && (
          <Card className="space-y-4">
            <p className="text-caption text-muted tracking-wider uppercase">Settled on-chain</p>
            <p className="font-display text-3xl tracking-tight">
              {bounty.winner && shortAddress(bounty.winner)} received {money(bounty.winnerAmount)}
            </p>
            <div className="text-body grid gap-2 sm:grid-cols-3">
              <p>
                Protocol fee:{" "}
                <span className="font-mono">
                  {money(winnerEvent ? BigInt(winnerEvent.fee ?? 0) : bounty.feeAmount)}
                </span>
              </p>
              <p>
                Reviewer rewards: <span className="font-mono">{money(reviewerTotal)}</span>
              </p>
              <p>
                Returned to creator:{" "}
                <span className="font-mono">{money(bounty.reviewPool - reviewerTotal)}</span>
              </p>
            </div>
            <SettlementLink hash={settlementHash} loading={events.isPending} />
            {winnerEvent && (
              <p className="text-caption text-muted">
                Settled {formatDateTime(winnerEvent.timestamp)}
              </p>
            )}
          </Card>
        )}

        {bounty.status === "refunded" && (
          <Card className="space-y-3">
            <p className="text-caption text-muted tracking-wider uppercase">Refunded</p>
            <p className="font-display text-3xl tracking-tight">
              {money(bounty.rewardAmount - reviewerTotal)} returned to the creator
            </p>
            <SettlementLink hash={settlementHash} loading={events.isPending} />
          </Card>
        )}

        {bounty.status === "expired" && (
          <Card className="text-body text-muted">
            No winner was selected before the review period ended.
            {isCreator ? " You can reclaim the escrowed balance below." : ""}
          </Card>
        )}

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-title tracking-tight sm:text-4xl">
              Community evaluation
            </h2>
            <p className="text-caption text-muted">
              {bounty.reviewCount} of {bounty.reviewSlots} reviews submitted
            </p>
          </div>
          {bounty.submissions.length === 0 ? (
            <p className="text-body text-muted">No submissions yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ranked.map(({ submission, average }, rank) => (
                <Card
                  key={submission.index}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="text-caption text-muted">
                      #{rank + 1} · Submission {submission.index + 1}
                    </p>
                    <p className="text-caption text-muted mt-1">
                      {shortAddress(submission.submitter)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-4xl leading-none">
                      {average === null ? "—" : average.toFixed(1)}
                    </p>
                    <p className="text-caption text-muted mt-1">{bounty.reviewCount} reviews</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <p className="text-caption text-muted">
            Scores guide the decision. The creator selects the winner, and community scores never
            pay out automatically.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">Submissions</h2>
          {bounty.submissions.map((submission) => (
            <SubmissionCard
              key={submission.index}
              submission={submission}
              isWinner={sameAddress(bounty.winner, submission.submitter)}
              reviewCount={bounty.reviewCount}
              totalScore={bounty.scoreTotals[submission.index] ?? BigInt(0)}
              action={
                canSelect && !isWrongNetwork ? (
                  <Button
                    variant="secondary"
                    onClick={() => onSelect(submission.index)}
                    disabled={busy}
                  >
                    Select winner
                  </Button>
                ) : undefined
              }
            />
          ))}
          <TxStatus state={selectTx.state} label="Select winner" />
        </section>

        {reviews.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-display text-title tracking-tight sm:text-4xl">
              Reviewer feedback
            </h2>
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.txHash + review.logIndex} className="space-y-2 p-5">
                  <p className="text-caption text-muted">
                    Review {review.reviewNumber} ·{" "}
                    <a
                      href={addressUrl(review.actor)}
                      className="font-mono"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortAddress(review.actor)}
                    </a>{" "}
                    · {formatReward(BigInt(review.amount ?? 0))} reviewer reward
                  </p>
                  <p className="text-body whitespace-pre-wrap">
                    {feedbackText(review.feedback) || "No written feedback."}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {canSubmit &&
          (isConnected ? (
            <SubmitWorkForm bountyId={id} />
          ) : (
            <ConnectPrompt message="Connect a wallet to submit work to this bounty." />
          ))}
      </section>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <Card className="space-y-6">
          <div>
            <p className="text-caption text-muted tracking-wider uppercase">Reward escrowed</p>
            <p className="font-display mt-2 text-5xl leading-none">{money(bounty.rewardAmount)}</p>
          </div>
          <div className="text-body space-y-4">
            <div>
              <p className="text-caption text-muted">Submission deadline</p>
              <p className="mt-1">{formatDateTime(bounty.deadline)}</p>
              {bounty.status === "open" && (
                <p className="text-caption mt-1">
                  <Countdown deadline={bounty.deadline} />
                </p>
              )}
            </div>
            <div>
              <p className="text-caption text-muted">Review ends</p>
              <p className="mt-1">{formatDateTime(bounty.reviewEnd)}</p>
            </div>
            <div>
              <p className="text-caption text-muted">Creator</p>
              <a
                href={addressUrl(bounty.creator)}
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-accent mt-1 inline-block font-mono underline decoration-2 underline-offset-4"
              >
                {shortAddress(bounty.creator)} {isCreator ? "(you)" : ""} ↗
              </a>
            </div>
          </div>
          <div className="border-line border-t pt-6">
            <p className="text-caption text-muted mb-4 tracking-wider uppercase">
              Where the money goes
            </p>
            <EconomicsPanel reward={bounty.rewardAmount} />
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-caption text-muted tracking-wider uppercase">
            What good work looks like
          </p>
          {bounty.deliverables && (
            <div>
              <p className="text-body font-medium">Deliverables</p>
              <p className="text-body text-muted mt-1 whitespace-pre-wrap">{bounty.deliverables}</p>
            </div>
          )}
          {bounty.acceptanceCriteria && (
            <div>
              <p className="text-body font-medium">Acceptance</p>
              <p className="text-body text-muted mt-1 whitespace-pre-wrap">
                {bounty.acceptanceCriteria}
              </p>
            </div>
          )}
          {bounty.rubric.length > 0 && (
            <div className="space-y-2">
              <p className="text-body font-medium">Rubric</p>
              {bounty.rubric.map((criterion) => (
                <div key={criterion.name} className="text-body flex justify-between">
                  <span>{criterion.name}</span>
                  <span className="font-mono">{criterion.weight}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {canSelect && (
          <p className="text-caption text-muted">
            Pick a submission to pay it out. Selection closes at the review end.
          </p>
        )}
        {canRefund && (
          <Card className="space-y-4">
            <p className="text-body">
              Reclaim the escrowed balance, minus review rewards already paid.
            </p>
            {isWrongNetwork ? (
              <Button onClick={switchToMonadTestnet} disabled={isSwitching} className="w-full">
                Switch to Monad Testnet
              </Button>
            ) : (
              <Button variant="danger" onClick={onRefund} disabled={busy} className="w-full">
                Reclaim reward
              </Button>
            )}
            <TxStatus state={refundTx.state} label="Reclaim reward" />
          </Card>
        )}
      </aside>
    </div>
  );
}

function SettlementLink({ hash, loading }: { hash?: Hash; loading: boolean }) {
  if (hash) {
    return (
      <a
        href={txUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption decoration-accent inline-block font-mono underline decoration-2 underline-offset-4"
      >
        {hash.slice(0, 12)}…{hash.slice(-6)} ↗ Monadscan
      </a>
    );
  }
  return (
    <p className="text-caption text-muted">
      {loading
        ? "Loading the settlement transaction from chain events…"
        : "Settlement transaction is not in the index yet."}
    </p>
  );
}
