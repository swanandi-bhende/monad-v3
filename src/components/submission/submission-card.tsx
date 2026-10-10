import { Badge } from "@/components/ui/badge";
import { addressUrl } from "@/lib/blockchain/transaction";
import { formatDateTime, shortAddress } from "@/lib/utils/format";
import { decodeEvidence } from "@/lib/utils/evidence";
import type { Submission } from "@/types/submission";

export function SubmissionCard({
  submission,
  isWinner,
  action,
}: {
  submission: Submission;
  isWinner: boolean;
  action?: React.ReactNode;
}) {
  const evidence = decodeEvidence(submission.evidence);

  return (
    <div className="fade-in border-line bg-surface rounded-lg border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-caption flex items-center gap-3">
          <span className="font-medium">Submission #{submission.index + 1}</span>
          <a
            href={addressUrl(submission.submitter)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink font-mono"
          >
            {shortAddress(submission.submitter)} ↗
          </a>
          <span className="text-muted">{formatDateTime(submission.submittedAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          {isWinner && <Badge tone="completed">Winner</Badge>}
          {action}
        </div>
      </div>
      <p className="text-body text-ink mt-3 whitespace-pre-wrap">{evidence.text}</p>
      {evidence.url && (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-accent mt-3 inline-block break-all hover:underline"
        >
          {evidence.url} ↗
        </a>
      )}
    </div>
  );
}
