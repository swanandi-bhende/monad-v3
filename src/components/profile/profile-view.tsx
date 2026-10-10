"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card, Stat } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { QueryError } from "@/components/ui/query-error";
import { useChainEvents } from "@/hooks/activity/use-chain-events";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { addressUrl, txUrl } from "@/lib/blockchain/transaction";
import { formatDateTime, formatReward } from "@/lib/utils/format";
import { computeProfile, sameAddress } from "@/lib/utils/profile";
import type { ChainEvent } from "@/types/event";

export function ProfileView() {
  const { address } = useWallet();
  const bounties = useBounties();
  const events = useChainEvents();
  const [tab, setTab] = useState<"history" | "activity">("history");

  if (!address)
    return <ConnectPrompt message="Connect a wallet to see your verifiable work history." />;
  if (bounties.isPending || events.isPending)
    return <p className="text-muted">Loading your history from chain…</p>;
  if (bounties.isError) {
    return <QueryError error={bounties.error} onRetry={() => bounties.refetch()} />;
  }
  if (events.isError) return <QueryError error={events.error} onRetry={() => events.refetch()} />;

  const chainEvents: ChainEvent[] = events.data;
  const profile = computeProfile(bounties.data, chainEvents, address);
  const myEvents = chainEvents
    .filter((e) => sameAddress(e.actor, address))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-display font-semibold tracking-tight">Profile</h1>
        <a
          href={addressUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body text-muted hover:text-ink font-mono"
        >
          {address} ↗
        </a>
      </section>

      <section className="space-y-4">
        <h2 className="text-title font-semibold tracking-tight">Reputation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Bounties won" value={profile.work.length} />
          <Stat label="Completed bounties (as submitter)" value={profile.completedWork.length} />
          <Stat label="Bounties posted" value={profile.posted.length} />
          <Stat label="Total rewards earned" value={formatReward(profile.totalEarned)} />
        </div>
        <Card className="text-caption text-muted space-y-2">
          <p>
            Reputation counts only on-chain outcomes: bounties won, completed bounties, and rewards
            paid to your wallet. Each number links back to the underlying transactions below.
          </p>
          <p>
            Credible signals received ({profile.received.credible}) are shown as supporting context
            only. They do not change payouts or the numbers above.
          </p>
        </Card>
      </section>

      <div className="flex gap-2">
        {(["history", "activity"] as const).map((value) => (
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
            {value === "history" ? `Work history (${profile.work.length})` : "My activity"}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <section className="space-y-4">
          {profile.work.length === 0 ? (
            <Card>
              <p className="text-body text-muted">
                No bounties won yet.{" "}
                <Link href="/" className="text-accent hover:underline">
                  Browse open bounties
                </Link>
              </p>
            </Card>
          ) : (
            <Card className="divide-line divide-y p-0">
              {profile.work.map(({ event, bounty }) => (
                <div
                  key={event.txHash}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/bounty/${event.bountyId}`}
                      className="text-body hover:text-accent truncate font-medium"
                    >
                      {bounty?.title ?? `Bounty #${event.bountyId}`}
                    </Link>
                    <p className="text-caption text-muted mt-1">
                      Completed {event.timestamp ? formatDateTime(event.timestamp) : "—"}
                    </p>
                  </div>
                  <div className="text-caption flex items-center gap-4">
                    <span className="font-mono">{formatReward(BigInt(event.amount ?? 0))}</span>
                    {bounty && <StatusBadge status={bounty.status} />}
                    <a
                      href={txUrl(event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent font-mono hover:underline"
                    >
                      tx ↗
                    </a>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}

      {tab === "activity" && (
        <section className="space-y-4">
          <ActivityFeed events={myEvents} emptyText="No on-chain activity from this wallet yet." />
        </section>
      )}
    </div>
  );
}
