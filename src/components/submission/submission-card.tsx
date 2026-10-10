import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CredibilityControls,
  CredibilitySummary,
} from "@/components/submission/credibility-controls";
import { addressUrl } from "@/lib/blockchain/transaction";
import { formatDateTime, shortAddress } from "@/lib/utils/format";
import { decodeEvidence } from "@/lib/utils/evidence";
import type { Credibility } from "@/lib/utils/credibility";
import type { Submission } from "@/types/submission";

export function SubmissionCard({
  bountyId,
  submission,
  isWinner,
  action,
  credibility,
  viewerSignal,
}: {
  bountyId: bigint;
  submission: Submission;
  isWinner: boolean;
  action?: ReactNode;
  credibility: Credibility;
  viewerSignal?: "credible" | "low_quality";
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
      <div className="border-line mt-4 space-y-3 border-t pt-4">
        <CredibilitySummary credibility={credibility} />
        <CredibilityControls
          bountyId={bountyId}
          submission={submission}
          viewerSignal={viewerSignal}
        />
      </div>
    </div>
  );
}
