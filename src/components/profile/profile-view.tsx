"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card, Stat } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { FaucetCard } from "@/components/forms/faucet-card";
import { FilterChips } from "@/components/ui/chips";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { addressUrl, txUrl } from "@/lib/blockchain/transaction";
import { formatAmount, formatDateTime, formatReward, shortAddress } from "@/lib/utils/format";
import { computeReputation, sameAddress } from "@/lib/utils/profile";
import { REWARD_TOKEN } from "@/lib/config/tokens";

type Tab = "history" | "reviews" | "activity";

export function ProfileView() {
  const { address } = useWallet();
  const bounties = useBounties();
  const events = useChainEvents();
  const [tab, setTab] = useState<Tab>("history");

  if (!address)
    return (
      <ConnectPrompt message="Connect a wallet to see your builder and reviewer reputation." />
    );
  if (bounties.isPending || events.isPending)
    return <LoadingState label="Loading your history from chain…" />;
  if (bounties.isError)
    return <ErrorState error={bounties.error} onRetry={() => bounties.refetch()} />;
  if (events.isError) return <ErrorState error={events.error} onRetry={() => events.refetch()} />;

  const rep = computeReputation(bounties.data, events.data, address);
  const money = (amount: bigint) =>
    formatAmount(amount, REWARD_TOKEN.decimals, REWARD_TOKEN.symbol);
  const myEvents = events.data
    .filter((e) => sameAddress(e.actor, address))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <p className="text-caption text-muted tracking-wider uppercase">Portable work credential</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight tracking-tight">
              Your record
            </h1>
            <a
              href={addressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-muted hover:text-ink font-mono"
            >
              {shortAddress(address)} · {address} ↗
            </a>
          </div>
          <div className="text-right">
            <p className="text-caption text-muted">Total earned</p>
            <p className="font-display text-5xl leading-none">{money(rep.totalEarned)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="font-display text-title tracking-tight">Builder</p>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Bounties won" value={rep.wins.length} />
            <Stat label="Completed bounties" value={rep.completedSubmitted.length} />
          </div>
          <Card className="space-y-2">
            <p className="text-caption text-muted">Earned from completed work</p>
            <p className="font-display text-3xl">{money(rep.workEarned)}</p>
          </Card>
        </div>
        <div className="space-y-5">
          <p className="font-display text-title tracking-tight">Reviewer</p>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Reviews completed" value={rep.reviews.length} />
            <Stat label="Bounties posted" value={rep.posted.length} />
          </div>
          <Card className="space-y-2">
            <p className="text-caption text-muted">Earned from reviews</p>
            <p className="font-display text-3xl">{money(rep.reviewEarned)}</p>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-caption text-muted">Total earned</p>
          <p className="font-display text-3xl">{money(rep.totalEarned)}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-caption text-muted">From completed work</p>
          <p className="font-display text-3xl">{money(rep.workEarned)}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-caption text-muted">From reviews</p>
          <p className="font-display text-3xl">{money(rep.reviewEarned)}</p>
        </Card>
      </section>

      <p className="text-caption text-muted max-w-2xl">
        Reputation counts only on-chain outcomes: bounties won, completed bounties, reviews you
        submitted, and the rewards paid to your wallet. Every line links to its transaction. Review
        agreement and quality scores are not part of this record yet.
      </p>

      <section className="space-y-8">
        <FilterChips
          options={[
            { value: "history" as const, label: `Work history (${rep.wins.length})` },
            { value: "reviews" as const, label: `Review history (${rep.reviews.length})` },
            { value: "activity" as const, label: "My activity" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "history" &&
          (rep.wins.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No bounties won yet.{" "}
                <Link
                  href="/"
                  className="decoration-accent underline decoration-2 underline-offset-4"
                >
                  Find work
                </Link>
                .
              </p>
            </Card>
          ) : (
            <Card className="divide-line divide-y p-0">
              {rep.wins.map(({ event, bounty, amount }) => (
                <div
                  key={event.txHash}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/bounty/${event.bountyId}`}
                      className="font-display truncate text-2xl hover:underline"
                    >
                      {bounty.title}
                    </Link>
                    <p className="text-caption text-muted mt-1">
                      Completed {event.timestamp ? formatDateTime(event.timestamp) : "—"}
                    </p>
                  </div>
                  <div className="text-caption flex items-center gap-4">
                    <span className="text-body font-mono">{formatReward(amount)}</span>
                    <StatusBadge status={bounty.status} />
                    <a
                      href={txUrl(event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="decoration-accent font-mono underline decoration-2 underline-offset-4"
                    >
                      tx ↗
                    </a>
                  </div>
                </div>
              ))}
            </Card>
          ))}

        {tab === "reviews" &&
          (rep.reviews.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No reviews yet.{" "}
                <Link
                  href="/review"
                  className="decoration-accent underline decoration-2 underline-offset-4"
                >
                  Earn by reviewing
                </Link>
                .
              </p>
            </Card>
          ) : (
            <Card className="divide-line divide-y p-0">
              {rep.reviews.map((event) => (
                <div
                  key={event.txHash + event.logIndex}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
                >
                  <div>
                    <Link
                      href={`/bounty/${event.bountyId}`}
                      className="font-display text-2xl hover:underline"
                    >
                      Bounty #{event.bountyId}
                    </Link>
                    <p className="text-caption text-muted mt-1">
                      Review {event.reviewNumber} ·{" "}
                      {event.timestamp ? formatDateTime(event.timestamp) : "—"}
                    </p>
                  </div>
                  <div className="text-caption flex items-center gap-4">
                    <span className="text-body font-mono">
                      {formatReward(BigInt(event.amount ?? 0))}
                    </span>
                    <a
                      href={txUrl(event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="decoration-accent font-mono underline decoration-2 underline-offset-4"
                    >
                      tx ↗
                    </a>
                  </div>
                </div>
              ))}
            </Card>
          ))}

        {tab === "activity" && (
          <ActivityFeed events={myEvents} emptyText="No on-chain activity from this wallet yet." />
        )}
      </section>

      <FaucetCard />
    </div>
  );
}
