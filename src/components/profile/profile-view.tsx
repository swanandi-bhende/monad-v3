"use client";

import Link from "next/link";
import { BountyCard } from "@/components/bounty/bounty-card";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card, Stat } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { addressUrl } from "@/lib/blockchain/transaction";
import { formatDateTime, formatReward } from "@/lib/utils/format";
import { computeProfile, sameAddress, submissionsBy } from "@/lib/utils/profile";

export function ProfileView() {
  const { address } = useWallet();
  const { data: bounties, isPending, error } = useBounties();

  if (!address)
    return <ConnectPrompt message="Connect a wallet to see your profile and work history." />;
  if (isPending) return <p className="text-muted">Loading your history…</p>;
  if (error) return <p className="text-body text-danger">{error.message}</p>;

  const profile = computeProfile(bounties, address);
  const activity = submissionsBy(bounties, address).slice(0, 10);

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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bounties won" value={profile.won.length} />
        <Stat label="Bounties posted" value={profile.posted.length} />
        <Stat label="Total rewards earned" value={formatReward(profile.totalEarned)} />
        <Stat label="Success rate" value={`${Math.round(profile.successRate * 100)}%`} />
      </section>

      <section className="space-y-4">
        <h2 className="text-title font-semibold tracking-tight">Won bounties</h2>
        <p className="text-caption text-muted">
          {profile.completedWork.length} completed bounties where you submitted work,{" "}
          {profile.won.length} won.
        </p>
        {profile.won.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {profile.won.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-title font-semibold tracking-tight">Recent activity</h2>
        {activity.length === 0 && <p className="text-body text-muted">No submissions yet.</p>}
        {activity.length > 0 && (
          <Card className="divide-line divide-y p-0">
            {activity.map(({ bounty, submission }) => (
              <Link
                key={`${bounty.id}-${submission.index}`}
                href={`/bounty/${bounty.id}`}
                className="text-caption hover:bg-surface-raised flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <span>Submitted to {bounty.title}</span>
                  <StatusBadge status={bounty.status} />
                </span>
                <span className="text-muted">
                  {formatDateTime(submission.submittedAt)}
                  {sameAddress(bounty.winner, address) ? " · won" : ""}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
