import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Countdown } from "@/components/bounty/countdown";
import { StatusBadge } from "@/components/bounty/status-badge";
import { formatReward, shortAddress } from "@/lib/utils/format";
import type { BountyWithSubmissions } from "@/types/bounty";

export function BountyCard({ bounty }: { bounty: BountyWithSubmissions }) {
  return (
    <Link href={`/bounty/${bounty.id}`} className="group block">
      <Card className="group-hover:border-accent/60 h-full transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-caption text-muted">
              #{bounty.id.toString()} · {bounty.category}
            </p>
            <h3 className="font-display text-title mt-1 truncate tracking-tight">{bounty.title}</h3>
          </div>
          <StatusBadge status={bounty.status} />
        </div>
        <p className="text-body text-muted mt-3 line-clamp-2">{bounty.description}</p>
        <div className="text-caption border-line mt-5 grid grid-cols-2 gap-3 border-t pt-4">
          <div>
            <p className="text-muted">Reward</p>
            <p className="text-ink mt-1 font-mono">{formatReward(bounty.rewardAmount)}</p>
          </div>
          <div>
            <p className="text-muted">Deadline</p>
            <p className="mt-1">
              {bounty.status === "open" ? <Countdown deadline={bounty.deadline} /> : "Closed"}
            </p>
          </div>
          <div>
            <p className="text-muted">Creator</p>
            <p className="mt-1 font-mono">{shortAddress(bounty.creator)}</p>
          </div>
          <div>
            <p className="text-muted">Submissions</p>
            <p className="mt-1">{bounty.submissions.length}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
