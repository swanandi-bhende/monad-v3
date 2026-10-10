"use client";

import Link from "next/link";
import { useState } from "react";
import { BountyCard } from "@/components/bounty/bounty-card";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { FilterChips } from "@/components/ui/chips";
import { QueryError } from "@/components/ui/query-error";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { formatDateTime, formatReward } from "@/lib/utils/format";
import { sameAddress, submissionsBy } from "@/lib/utils/profile";
import type { BountyWithSubmissions } from "@/types/bounty";

type Tab = "posted" | "submitted";
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

const OUTCOME_LABEL: Record<SubmittedFilter, string> = {
  pending: "Pending",
  selected: "Selected",
  not_selected: "Not selected",
};

export function MyBountiesView() {
  const { address } = useWallet();
  const bounties = useBounties();
  const [tab, setTab] = useState<Tab>("posted");
  const [postedFilter, setPostedFilter] = useState<PostedFilter>("open");
  const [submittedFilter, setSubmittedFilter] = useState<SubmittedFilter>("pending");

  if (!address)
    return (
      <ConnectPrompt message="Connect a wallet to see the bounties you posted or submitted to." />
    );
  if (bounties.isPending) return <p className="text-muted">Loading your bounties…</p>;
  if (bounties.isError)
    return <QueryError error={bounties.error} onRetry={() => bounties.refetch()} />;

  const all = bounties.data;
  const posted = all.filter((b) => sameAddress(b.creator, address));
  const submitted = submissionsBy(all, address);
  const postedVisible = posted.filter((b) => postedMatches(b, postedFilter));
  const submittedVisible = submitted.filter(
    ({ bounty }) => outcome(bounty, address) === submittedFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["posted", "submitted"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`text-caption rounded-full border px-4 py-1.5 transition-colors ${
              tab === value
                ? "border-accent bg-accent/15 text-ink"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {value === "posted"
              ? `Posted by me (${posted.length})`
              : `Submitted by me (${submitted.length})`}
          </button>
        ))}
      </div>

      {tab === "posted" && (
        <div className="space-y-5">
          <FilterChips options={POSTED_OPTIONS} value={postedFilter} onChange={setPostedFilter} />
          {postedVisible.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No {POSTED_OPTIONS.find((o) => o.value === postedFilter)?.label.toLowerCase()}{" "}
                bounties.{" "}
                <Link href="/post" className="text-accent hover:underline">
                  Post a bounty
                </Link>
              </p>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {postedVisible.map((bounty) => (
                <BountyCard key={bounty.id.toString()} bounty={bounty} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "submitted" && (
        <div className="space-y-5">
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
                  className="hover:bg-surface-raised flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-body truncate font-medium">{bounty.title}</p>
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
    </div>
  );
}
