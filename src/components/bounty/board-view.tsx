"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { BountyCard } from "@/components/bounty/bounty-card";
import { Card, Stat } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/chips";
import { QueryError } from "@/components/ui/query-error";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { BOUNTY_STATUS_LABELS } from "@/constants/bounty";
import { formatReward } from "@/lib/utils/format";
import type { BountyStatus, BountyWithSubmissions } from "@/types/bounty";

type Filter = BountyStatus | "all";
type Sort = "ending" | "reward" | "newest";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "open", label: BOUNTY_STATUS_LABELS.open },
  { value: "under_review", label: BOUNTY_STATUS_LABELS.under_review },
  { value: "expired", label: BOUNTY_STATUS_LABELS.expired },
  { value: "completed", label: BOUNTY_STATUS_LABELS.completed },
  { value: "refunded", label: BOUNTY_STATUS_LABELS.refunded },
  { value: "all", label: "All" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "ending", label: "Ending soon" },
  { value: "reward", label: "Highest reward" },
  { value: "newest", label: "Newest" },
];

function applyFilters(bounties: BountyWithSubmissions[], filter: Filter, sort: Sort) {
  const visible = filter === "all" ? bounties : bounties.filter((b) => b.status === filter);
  const sorted = [...visible];
  if (sort === "ending") sorted.sort((a, b) => a.deadline - b.deadline);
  if (sort === "reward") {
    sorted.sort((a, b) =>
      a.rewardAmount === b.rewardAmount ? 0 : a.rewardAmount > b.rewardAmount ? -1 : 1,
    );
  }
  if (sort === "newest") sorted.sort((a, b) => Number(b.id - a.id));
  return sorted;
}

export function BoardView() {
  const bounties = useBounties();
  const events = useChainEvents();
  const [filter, setFilter] = useState<Filter>("open");
  const [sort, setSort] = useState<Sort>("ending");

  if (bounties.isPending) return <p className="text-muted">Loading bounties from Monad Testnet…</p>;
  if (bounties.isError) {
    return (
      <QueryError
        error={bounties.error}
        onRetry={() => {
          bounties.refetch();
          events.refetch();
        }}
      />
    );
  }

  const all = bounties.data;
  const openBounties = all.filter((b) => b.status === "open" || b.status === "under_review");
  const openReward = openBounties.reduce((sum, b) => sum + b.rewardAmount, BigInt(0));
  const completed = all.filter((b) => b.status === "completed").length;
  const visible = applyFilters(all, filter, sort);
  const recent = [...(events.data ?? [])].reverse().slice(0, 8);

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-display font-semibold tracking-tight">Bounty board</h1>
            <p className="text-body text-muted mt-2">
              Post work, compete to deliver, and get paid from escrow on Monad.
            </p>
          </div>
          <Link
            href="/post"
            className="text-caption bg-accent text-accent-ink hover:bg-accent-hover rounded-md px-4 py-2 font-medium"
          >
            Post a bounty
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Open bounties" value={openBounties.length} />
          <Stat label="Open rewards" value={formatReward(openReward)} />
          <Stat label="Completed" value={completed} />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          <select
            aria-label="Sort bounties"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="text-caption border-line bg-surface text-ink focus:border-accent rounded-md border px-3 py-1.5 focus:outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <Card>
            <p className="text-body text-muted">No bounties match this filter yet.</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {visible.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-title font-semibold tracking-tight">Recent activity</h2>
        {events.isError ? (
          <QueryError error={events.error} onRetry={() => events.refetch()} />
        ) : (
          <ActivityFeed
            events={recent}
            emptyText={
              events.isPending
                ? "Indexing on-chain activity from Monad. The first load can take about a minute."
                : "No activity yet."
            }
          />
        )}
      </section>
    </div>
  );
}
