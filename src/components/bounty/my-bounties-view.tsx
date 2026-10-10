"use client";

import Link from "next/link";
import { useState } from "react";
import { BountyCard } from "@/components/bounty/bounty-card";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { FilterChips } from "@/components/ui/chips";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { formatDateTime, formatReward } from "@/lib/utils/format";
import { sameAddress, submissionsBy } from "@/lib/utils/profile";
import type { BountyWithSubmissions } from "@/types/bounty";

type Tab = "posted" | "submitted" | "reviewed";
type PostedFilter = "open" | "completed" | "expired";
type SubmittedFilter = "pending" | "selected" | "not_selected";

const POSTED_OPTIONS: { value: PostedFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

const SUBMITTED_OPTIONS: { value: SubmittedFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not selected" },
];

const OUTCOME_LABEL: Record<SubmittedFilter, string> = {
  pending: "Pending",
  selected: "Selected",
  not_selected: "Not selected",
};

function postedMatches(bounty: BountyWithSubmissions, filter: PostedFilter) {
  if (filter === "open") return bounty.status === "open" || bounty.status === "under_review";
  if (filter === "completed") return bounty.status === "completed";
  return bounty.status === "expired" || bounty.status === "refunded";
}

function outcome(bounty: BountyWithSubmissions, address: `0x${string}`): SubmittedFilter {
  if (sameAddress(bounty.winner, address)) return "selected";
  if (bounty.status === "completed") return "not_selected";
  return "pending";
}

export function MyBountiesView() {
  const { address } = useWallet();
  const bounties = useBounties();
  const events = useChainEvents();
  const [tab, setTab] = useState<Tab>("posted");
  const [postedFilter, setPostedFilter] = useState<PostedFilter>("open");
  const [submittedFilter, setSubmittedFilter] = useState<SubmittedFilter>("pending");

  if (!address)
    return (
      <ConnectPrompt message="Connect a wallet to see the bounties you posted, submitted to, or reviewed." />
    );
  if (bounties.isPending) return <LoadingState label="Loading your bounties…" />;
  if (bounties.isError)
    return <ErrorState error={bounties.error} onRetry={() => bounties.refetch()} />;

  const all = bounties.data;
  const posted = all.filter((b) => sameAddress(b.creator, address));
  const submitted = submissionsBy(all, address);
  const reviewed = (events.data ?? []).filter(
    (e) => e.kind === "reviewed" && sameAddress(e.actor, address),
  );
  const postedVisible = posted.filter((b) => postedMatches(b, postedFilter));
  const submittedVisible = submitted.filter(
    ({ bounty }) => outcome(bounty, address) === submittedFilter,
  );

  return (
    <div className="space-y-8">
      <FilterChips
        options={[
          { value: "posted" as const, label: `Posted by me (${posted.length})` },
          { value: "submitted" as const, label: `Submitted by me (${submitted.length})` },
          { value: "reviewed" as const, label: `Reviewed by me (${reviewed.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "posted" && (
        <div className="space-y-6">
          <FilterChips options={POSTED_OPTIONS} value={postedFilter} onChange={setPostedFilter} />
          {postedVisible.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No {POSTED_OPTIONS.find((o) => o.value === postedFilter)?.label.toLowerCase()}{" "}
                bounties.{" "}
                <Link
                  href="/post"
                  className="decoration-accent underline decoration-2 underline-offset-4"
                >
                  Post one
                </Link>
                .
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {postedVisible.map((bounty) => (
                <BountyCard key={bounty.id.toString()} bounty={bounty} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "submitted" && (
        <div className="space-y-6">
          <FilterChips
            options={SUBMITTED_OPTIONS}
            value={submittedFilter}
            onChange={setSubmittedFilter}
          />
          {submittedVisible.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No {OUTCOME_LABEL[submittedFilter].toLowerCase()} submissions.
              </p>
            </Card>
          ) : (
            <Card className="divide-line divide-y p-0">
              {submittedVisible.map(({ bounty, submission }) => (
                <Link
                  key={`${bounty.id}-${submission.index}`}
                  href={`/bounty/${bounty.id}`}
                  className="hover:bg-canvas flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate text-2xl">{bounty.title}</p>
                    <p className="text-caption text-muted mt-1">
                      Submitted {formatDateTime(submission.submittedAt)} ·{" "}
                      {formatReward(bounty.rewardAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={bounty.status} />
                    <span className="text-caption text-muted">
                      {OUTCOME_LABEL[outcome(bounty, address)]}
                    </span>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "reviewed" &&
        (reviewed.length === 0 ? (
          <Card>
            <p className="text-body text-muted">
              You have not reviewed any work yet.{" "}
              <Link
                href="/review"
                className="decoration-accent underline decoration-2 underline-offset-4"
              >
                Review &amp; earn
              </Link>
              .
            </p>
          </Card>
        ) : (
          <Card className="divide-line divide-y p-0">
            {reviewed.map((event) => {
              const bounty = all.find((b) => Number(b.id) === event.bountyId);
              return (
                <Link
                  key={event.txHash + event.logIndex}
                  href={`/review/${event.bountyId}`}
                  className="hover:bg-canvas flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate text-2xl">
                      {bounty?.title ?? `Bounty #${event.bountyId}`}
                    </p>
                    <p className="text-caption text-muted mt-1">
                      Reviewed {event.timestamp ? formatDateTime(event.timestamp) : "—"}
                    </p>
                  </div>
                  <span className="text-body font-mono">
                    {formatReward(BigInt(event.amount ?? 0))}
                  </span>
                </Link>
              );
            })}
          </Card>
        ))}
    </div>
  );
}
