import Link from "next/link";
import { Card } from "@/components/ui/card";
import { txUrl } from "@/lib/blockchain/transaction";
import { describeEvent } from "@/lib/utils/activity";
import { formatDateTime } from "@/lib/utils/format";
import type { ChainEvent } from "@/types/event";

export function ActivityFeed({ events, emptyText }: { events: ChainEvent[]; emptyText: string }) {
  if (events.length === 0) {
    return (
      <Card>
        <p className="text-body text-muted">{emptyText}</p>
      </Card>
    );
  }

  return (
    <Card className="divide-line divide-y p-0">
      {events.map((event) => (
        <div
          key={`${event.txHash}-${event.logIndex}`}
          className="text-caption flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-accent size-1.5 shrink-0 rounded-full" />
            <Link href={`/bounty/${event.bountyId}`} className="hover:text-ink truncate">
              {describeEvent(event)}
            </Link>
          </div>
          <div className="text-muted flex items-center gap-4">
            <span>{event.timestamp ? formatDateTime(event.timestamp) : "—"}</span>
            <a
              href={txUrl(event.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink font-mono"
            >
              tx ↗
            </a>
          </div>
        </div>
      ))}
    </Card>
  );
}
