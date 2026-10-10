"use client";

import Link from "next/link";
import { Countdown } from "@/components/bounty/countdown";
import { Button } from "@/components/ui/button";
import { Card, Stat } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { formatReward, formatAmount } from "@/lib/utils/format";
import { reviewerRewardPerSlot } from "@/lib/config/economics";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import { sameAddress } from "@/lib/utils/profile";
import type { BountyWithSubmissions } from "@/types/bounty";

function estimatedMinutes(bounty: BountyWithSubmissions) {
  return Math.max(5, bounty.submissions.length * 5);
}

function isOpportunity(bounty: BountyWithSubmissions) {
  return (
    bounty.status === "under_review" &&
    bounty.submissions.length > 0 &&
    bounty.reviewCount < bounty.reviewSlots
  );
}

export function ReviewMarketplace() {
  const bounties = useBounties();
  const events = useChainEvents();
  const { address } = useWallet();

  if (bounties.isPending)
    return <LoadingState label="Finding review opportunities on Monad Testnet…" />;
  if (bounties.isError)
    return <ErrorState error={bounties.error} onRetry={() => bounties.refetch()} />;

  const all = bounties.data;
  const myReviews = new Set(
    (events.data ?? [])
      .filter((e) => e.kind === "reviewed" && sameAddress(e.actor, address))
      .map((e) => e.bountyId),
  );
  const open = all.filter(
    (b) =>
      isOpportunity(b) &&
      !(
        address &&
        (myReviews.has(Number(b.id)) || b.creator.toLowerCase() === address.toLowerCase())
      ),
  );
  const earnedPool = open.reduce(
    (sum, b) =>
      sum +
      reviewerRewardPerSlot(b.reviewPool, b.reviewSlots) * BigInt(b.reviewSlots - b.reviewCount),
    BigInt(0),
  );
  const upcoming = all.filter((b) => b.status === "open");

  return (
    <div className="space-y-16">
      <section className="border-line/80 bg-surface relative -mx-6 overflow-hidden rounded-xl border px-6 py-14 sm:mx-0 sm:px-14">
        <div className="hero-aura pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="space-y-5">
            <p className="text-caption text-muted tracking-wider uppercase">Review &amp; earn</p>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.02] tracking-tight">
              Earn by <span className="">reviewing</span> work.
            </h1>
            <p className="text-body text-muted max-w-xl text-lg">
              Score submissions against the creator&apos;s rubric. Every useful review pays a
              reviewer reward straight from the bounty&apos;s escrow.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Open reviews" value={open.length} />
            <Stat
              label="Reward ready"
              value={formatAmount(earnedPool, REWARD_TOKEN.decimals, REWARD_TOKEN.symbol)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-title tracking-tight sm:text-4xl">
            Review opportunities
          </h2>
          <p className="text-body text-muted">
            Bounties whose submission deadline has passed and that still need reviewers.
          </p>
        </div>
        {open.length === 0 ? (
          <div className="fade-in border-line bg-surface/60 rounded-xl border border-dashed p-10">
            <p className="font-display text-3xl tracking-tight">No reviews need you right now</p>
            <p className="text-body text-muted mt-3 max-w-md">
              Reviews open when a bounty&apos;s submission deadline passes. Check back soon, or post
              a bounty to get work reviewed.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {open.map((bounty) => (
              <ReviewCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-title tracking-tight">Opens after the deadline</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.slice(0, 4).map((bounty) => (
              <Card key={bounty.id.toString()} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display truncate text-xl">{bounty.title}</p>
                  <p className="text-caption text-muted mt-1">
                    {bounty.submissions.length} submissions so far
                  </p>
                </div>
                <p className="text-caption text-muted shrink-0">
                  <Countdown deadline={bounty.deadline} />
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewCard({ bounty }: { bounty: BountyWithSubmissions }) {
  const perReview = reviewerRewardPerSlot(bounty.reviewPool, bounty.reviewSlots);
  const progress = Math.round((bounty.reviewCount / bounty.reviewSlots) * 100);

  return (
    <Card interactive className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-caption text-muted">
            #{bounty.id.toString()} · {bounty.category}
          </p>
          <h3 className="font-display mt-1 truncate text-2xl tracking-tight">{bounty.title}</h3>
        </div>
        <span className="text-caption text-muted shrink-0">~{estimatedMinutes(bounty)} min</span>
      </div>

      <div className="border-line/80 grid grid-cols-3 gap-4 border-y py-5">
        <div>
          <p className="text-caption text-muted">Review reward</p>
          <p className="mt-1 font-mono text-lg">{formatReward(perReview)}</p>
        </div>
        <div>
          <p className="text-caption text-muted">Bounty</p>
          <p className="mt-1 font-mono text-lg">{formatReward(bounty.rewardAmount)}</p>
        </div>
        <div>
          <p className="text-caption text-muted">Submissions</p>
          <p className="mt-1 text-lg">{bounty.submissions.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-caption text-muted flex justify-between">
          <span>
            {bounty.reviewCount} of {bounty.reviewSlots} reviews completed
          </span>
          <span>
            <Countdown deadline={bounty.reviewEnd} /> to review
          </span>
        </div>
        <div className="bg-line h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-ink h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link href={`/review/${bounty.id}`} className="self-start">
        <Button>
          Review work <span aria-hidden>→</span>
        </Button>
      </Link>
    </Card>
  );
}
