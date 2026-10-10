import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { addressUrl } from "@/lib/blockchain/transaction";
import { formatDateTime, shortAddress } from "@/lib/utils/format";
import { decodeEvidence, LINK_KIND_LABEL } from "@/lib/utils/evidence";
import { averageScore } from "@/lib/utils/review";
import type { Submission } from "@/types/submission";

export function SubmissionCard({
  submission,
  isWinner,
  action,
  reviewCount,
  totalScore,
}: {
  submission: Submission;
  isWinner: boolean;
  action?: ReactNode;
  reviewCount: number;
  totalScore: bigint;
}) {
  const evidence = decodeEvidence(submission.evidence);
  const average = averageScore(totalScore, reviewCount);

  return (
    <div className="fade-in border-line/80 bg-surface space-y-5 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-caption flex flex-wrap items-center gap-3">
          <span className="font-display text-xl">Submission {submission.index + 1}</span>
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

      <div className="grid gap-5 md:grid-cols-[1fr_180px]">
        <div className="space-y-5">
          <section className="space-y-2">
            <p className="text-caption text-muted tracking-wider uppercase">Overview</p>
            <p className="text-body whitespace-pre-wrap">{evidence.text}</p>
          </section>
          {evidence.links.length > 0 && (
            <section className="space-y-2">
              <p className="text-caption text-muted tracking-wider uppercase">Links</p>
              <ul className="space-y-1.5">
                {evidence.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body decoration-accent break-all underline decoration-2 underline-offset-4"
                    >
                      {LINK_KIND_LABEL[link.kind]}: {link.url} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {evidence.files.length > 0 && (
            <section className="space-y-2">
              <p className="text-caption text-muted tracking-wider uppercase">Files</p>
              <ul className="space-y-1.5">
                {evidence.files.map((file) => (
                  <li key={file.cid}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body decoration-accent underline decoration-2 underline-offset-4"
                    >
                      {file.name} ↗
                    </a>
                    <span className="text-caption text-muted ml-2 font-mono">
                      {file.cid.slice(0, 12)}…
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="bg-canvas rounded-lg p-4">
          <p className="text-caption text-muted tracking-wider uppercase">Community score</p>
          {average === null ? (
            <p className="text-caption text-muted mt-3">No reviews yet</p>
          ) : (
            <p className="font-display mt-2 text-5xl leading-none">
              {average.toFixed(1)}
              <span className="text-body text-muted"> /10</span>
            </p>
          )}
          <p className="text-caption text-muted mt-3">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
    </div>
  );
}
