"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { BountyCard } from "@/components/bounty/bounty-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/chips";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { BOUNTY_STATUS_LABELS } from "@/constants/bounty";
import { formatReward } from "@/lib/utils/format";
import type { BountyStatus, BountyWithSubmissions } from "@/types/bounty";

type Filter = BountyStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "open", label: BOUNTY_STATUS_LABELS.open },
  { value: "under_review", label: BOUNTY_STATUS_LABELS.under_review },
  { value: "completed", label: BOUNTY_STATUS_LABELS.completed },
  { value: "expired", label: BOUNTY_STATUS_LABELS.expired },
  { value: "all", label: "All" },
];

const PATHS = [
  {
    href: "/",
    anchor: "#work",
    eyebrow: "Complete a bounty",
    title: "Get paid for the work you do.",
    body: "Find a task with a clear rubric, deliver it, and get paid from escrow when you win.",
    cta: "Find work",
  },
  {
    href: "/review",
    anchor: "",
    eyebrow: "Review work",
    title: "Get paid to judge the work.",
    body: "Score submissions against the creator's rubric. Every useful review pays a reviewer reward.",
    cta: "Start reviewing",
  },
  {
    href: "/post",
    anchor: "",
    eyebrow: "Post a bounty",
    title: "Hire the people who can do it.",
    body: "Define what good looks like, fund it from your USDC, and pay the winner automatically.",
    cta: "Post a bounty",
  },
];

const WORKER_STEPS = [
  "Find a task",
  "Complete it",
  "Submit your work",
  "Community reviews it",
  "Get paid",
  "Build reputation",
];
const HIRER_STEPS = [
  "Create a bounty",
  "Define what good work means",
  "Fund the bounty",
  "Receive submissions",
  "Get community evaluations",
  "Select the winner",
  "Pay automatically",
];

function byDeadline(a: BountyWithSubmissions, b: BountyWithSubmissions) {
  return a.deadline - b.deadline;
}

export function BoardView() {
  const bounties = useBounties();
  const events = useChainEvents();
  const [filter, setFilter] = useState<Filter>("open");

  if (bounties.isPending) return <LoadingState label="Loading bounties from Monad Testnet…" />;
  if (bounties.isError) {
    return (
      <ErrorState
        error={bounties.error}
        onRetry={() => {
          bounties.refetch();
          events.refetch();
        }}
      />
    );
  }

  const all = bounties.data;
  const open = all.filter((b) => b.status === "open");
  const reviewing = all.filter(
    (b) => b.status === "under_review" && b.reviewCount < b.reviewSlots && b.submissions.length > 0,
  );
  const completed = all
    .filter((b) => b.status === "completed")
    .sort((a, b) => b.deadline - a.deadline)
    .slice(0, 4);
  const topEarning = [...open]
    .sort((a, b) =>
      a.rewardAmount === b.rewardAmount ? 0 : a.rewardAmount > b.rewardAmount ? -1 : 1,
    )
    .slice(0, 3);
  const endingSoon = [...open].sort(byDeadline).slice(0, 3);
  const visible = filter === "all" ? all : all.filter((b) => b.status === filter);
  const recent = [...(events.data ?? [])].reverse().slice(0, 8);
  const openReward = open.reduce((sum, b) => sum + b.rewardAmount, BigInt(0));

  return (
    <div className="space-y-24">
      <section className="border-line/80 bg-surface relative -mx-6 overflow-hidden rounded-xl border px-6 py-16 sm:mx-0 sm:px-14 sm:py-20">
        <div className="hero-aura pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div className="relative max-w-4xl space-y-7">
          <p className="text-caption text-muted tracking-wider uppercase">
            Get paid to do work. Get paid to judge it.
          </p>
          <h1 className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-[1.02] tracking-tight">
            Earn by building.
            <br />
            <span className="">Earn by reviewing.</span>
            <br />
            Build reputation that follows you.
          </h1>
          <p className="text-body text-muted max-w-2xl text-lg">
            Gig-a-Chad is a work and evaluation marketplace on Monad. Escrowed rewards pay the
            winner, reviewers earn for useful judgement, and every outcome is verifiable.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {PATHS.map((path) => (
          <Card key={path.eyebrow} interactive className="flex flex-col gap-5">
            <p className="text-caption text-muted tracking-wider uppercase">{path.eyebrow}</p>
            <p className="font-display text-3xl leading-tight tracking-tight">{path.title}</p>
            <p className="text-body text-muted">{path.body}</p>
            <Link href={path.href + path.anchor} className="mt-auto self-start">
              <Button variant="secondary">
                {path.cta} <span aria-hidden>→</span>
              </Button>
            </Link>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-6">
          <p className="font-display text-3xl tracking-tight">How do you want to earn?</p>
          <div className="space-y-3">
            {["Complete bounties", "Review work", "Both"].map((option) => (
              <div
                key={option}
                className="text-body bg-canvas flex items-center justify-between rounded-lg px-5 py-4"
              >
                <span>{option}</span>
                <span aria-hidden className="text-muted">
                  →
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-6">
          <p className="font-display text-3xl tracking-tight">How Gig-a-Chad works</p>
          <ol className="space-y-3">
            {WORKER_STEPS.map((step, index) => (
              <li key={step} className="text-body flex gap-4">
                <span className="text-muted w-6 font-mono">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-6">
          <p className="font-display text-3xl tracking-tight">Want to hire talent?</p>
          <ol className="space-y-3">
            {HIRER_STEPS.map((step, index) => (
              <li key={step} className="text-body flex gap-4">
                <span className="text-muted w-6 font-mono">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <Link href="/post" className="inline-block">
            <Button>
              Post a bounty <span aria-hidden>→</span>
            </Button>
          </Link>
        </Card>
        <Card className="grid grid-cols-2 content-start gap-6">
          <div>
            <p className="text-caption text-muted">Open bounties</p>
            <p className="font-display mt-2 text-5xl leading-none">{open.length}</p>
          </div>
          <div>
            <p className="text-caption text-muted">Open rewards</p>
            <p className="font-display mt-2 text-4xl leading-none">{formatReward(openReward)}</p>
          </div>
          <div>
            <p className="text-caption text-muted">Needing review</p>
            <p className="font-display mt-2 text-5xl leading-none">{reviewing.length}</p>
          </div>
          <div>
            <p className="text-caption text-muted">Completed</p>
            <p className="font-display mt-2 text-5xl leading-none">
              {all.filter((b) => b.status === "completed").length}
            </p>
          </div>
        </Card>
      </section>

      <section id="work" className="scroll-mt-32 space-y-10">
        <div className="space-y-2">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">Work to do</h2>
          <p className="text-body text-muted">
            Open bounties and their rubrics. Read straight from the contract.
          </p>
        </div>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        {visible.length === 0 ? (
          <div className="fade-in border-line bg-surface/60 rounded-xl border border-dashed p-10">
            <p className="font-display text-3xl tracking-tight">Nothing here yet</p>
            <p className="text-body text-muted mt-3 max-w-md">
              No bounties match this filter. Post the first one and start the work.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-12 md:grid-cols-3">
        <Shelf title="Ending soon" bounties={endingSoon} />
        <Shelf title="Top earning" bounties={topEarning} />
        <Shelf title="Recently completed" bounties={completed} />
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">Needing review</h2>
          <p className="text-body text-muted">
            Submissions are closed. Reviewers earn a reward for each useful evaluation.
          </p>
        </div>
        {reviewing.length === 0 ? (
          <p className="text-body text-muted">Nothing needs review right now.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {reviewing.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">Recent activity</h2>
          <p className="text-body text-muted">
            Every post, submission, review, payout, and refund, from chain events.
          </p>
        </div>
        {events.isError ? (
          <ErrorState error={events.error} onRetry={() => events.refetch()} />
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

function Shelf({ title, bounties }: { title: string; bounties: BountyWithSubmissions[] }) {
  return (
    <div className="space-y-5">
      <p className="font-display text-2xl tracking-tight">{title}</p>
      {bounties.length === 0 ? (
        <p className="text-body text-muted">Nothing yet.</p>
      ) : (
        <ul className="divide-line border-line divide-y border-y">
          {bounties.map((bounty) => (
            <li key={bounty.id.toString()}>
              <Link
                href={`/bounty/${bounty.id}`}
                className="hover:text-ink flex items-center justify-between gap-4 py-4 transition-colors"
              >
                <span className="text-body truncate">{bounty.title}</span>
                <span className="text-caption text-muted shrink-0 font-mono">
                  {formatReward(bounty.rewardAmount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
