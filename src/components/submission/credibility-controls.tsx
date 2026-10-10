"use client";

import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/ui/tx-status";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { markSubmission } from "@/lib/blockchain/write";
import type { Credibility } from "@/lib/utils/credibility";
import { sameAddress } from "@/lib/utils/profile";
import type { Submission } from "@/types/submission";

export function CredibilitySummary({ credibility }: { credibility: Credibility }) {
  return (
    <p className="text-caption text-muted">
      <span className="text-status-open">{credibility.credible} credible</span>
      {" · "}
      <span className="text-danger">{credibility.lowQuality} low quality</span>
    </p>
  );
}

export function CredibilityControls({
  bountyId,
  submission,
  viewerSignal,
}: {
  bountyId: bigint;
  submission: Submission;
  viewerSignal?: "credible" | "low_quality";
}) {
  const { address, isConnected, isWrongNetwork } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const isOwn = sameAddress(address, submission.submitter);
  const busy = state.status === "awaiting_signature" || state.status === "pending";

  async function mark(signal: "credible" | "low_quality") {
    const receipt = await execute(() => markSubmission(bountyId, submission.index, signal));
    if (receipt) refresh();
  }

  let hint: string | null = null;
  if (!isConnected) hint = "Connect a wallet to add a credibility signal.";
  else if (isOwn) hint = "You cannot mark your own submission.";
  else if (viewerSignal)
    hint = `You marked this submission as ${viewerSignal === "credible" ? "credible" : "low quality"}.`;

  const disabled = !isConnected || isOwn || !!viewerSignal || busy || isWrongNetwork;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={disabled}
          onClick={() => mark("credible")}
        >
          Mark credible
        </Button>
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={disabled}
          onClick={() => mark("low_quality")}
        >
          Mark low quality
        </Button>
        {hint && <span className="text-caption text-muted">{hint}</span>}
      </div>
      <TxStatus state={state} label="Credibility signal" />
    </div>
  );
}
