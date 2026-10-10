"use client";

import Link from "next/link";
import { useState } from "react";
import { BountyCard } from "@/components/bounty/bounty-card";
import { StatusBadge } from "@/components/bounty/status-badge";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { useBounties } from "@/hooks/bounty/use-bounties";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { formatDateTime, formatReward } from "@/lib/utils/format";
import { computeProfile, sameAddress, submissionsBy } from "@/lib/utils/profile";

type Tab = "posted" | "submitted";

function outcome(
  bounty: { status: string; winner?: `0x${string}`; creator: string },
  address: `0x${string}`,
) {
  if (sameAddress(bounty.winner, address)) return "Won";
  if (bounty.status === "completed") return "Not selected";
  if (bounty.status === "open" || bounty.status === "under_review") return "Awaiting review";
  return "Closed";
}

export function MyBountiesView() {
  const { address } = useWallet();
  const { data: bounties, isPending, error } = useBounties();
  const [tab, setTab] = useState<Tab>("posted");

  if (!address)
    return (
      <ConnectPrompt message="Connect a wallet to see the bounties you posted or submitted to." />
    );
  if (isPending) return <p className="text-muted">Loading your bounties…</p>;
  if (error) return <p className="text-body text-danger">{error.message}</p>;

  const profile = computeProfile(bounties, address);
  const submitted = submissionsBy(bounties, address);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
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
              ? `Posted by me (${profile.posted.length})`
              : `Submitted by me (${submitted.length})`}
          </button>
        ))}
      </div>

      {tab === "posted" &&
        (profile.posted.length === 0 ? (
          <Card>
            <p className="text-body text-muted">
              You have not posted a bounty yet.{" "}
              <Link href="/post" className="text-accent hover:underline">
                Post one
              </Link>
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {profile.posted.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))}
          </div>
        ))}

      {tab === "submitted" &&
        (submitted.length === 0 ? (
          <Card>
            <p className="text-body text-muted">You have not submitted work yet.</p>
          </Card>
        ) : (
          <Card className="divide-line divide-y p-0">
            {submitted.map(({ bounty, submission }) => (
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
                  <span className="text-caption text-muted">{outcome(bounty, address)}</span>
                </div>
              </Link>
            ))}
          </Card>
        ))}
    </div>
  );
}
