"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { TxStatus } from "@/components/ui/tx-status";
import { Countdown } from "@/components/bounty/countdown";
import { StatusBadge } from "@/components/bounty/status-badge";
import { SubmitWorkForm } from "@/components/forms/submit-work-form";
import { SubmissionCard } from "@/components/submission/submission-card";
import { useBounty, useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { addressUrl, txUrl } from "@/lib/blockchain/transaction";
import { findSettlementTxHash } from "@/lib/blockchain/read";
import { refundBounty, selectWinner } from "@/lib/blockchain/write";
import { formatDateTime, formatReward, shortAddress } from "@/lib/utils/format";
import { sameAddress } from "@/lib/utils/profile";
import type { Hash } from "viem";

export function BountyDetail({ id }: { id: bigint }) {
  const query = useBounty(id);
  const { address, isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const refresh = useRefreshBounties();
  const selectTx = useTransaction();
  const refundTx = useTransaction();
  const bounty = query.data;
  const isCreator = sameAddress(address, bounty?.creator);
  const busy =
    selectTx.state.status === "awaiting_signature" ||
    selectTx.state.status === "pending" ||
    refundTx.state.status === "awaiting_signature" ||
    refundTx.state.status === "pending";

  const settlementEvent = bounty?.status === "completed" ? "WinnerSelected" : "BountyRefunded";
  const settlement = useQuery({
    queryKey: ["settlement", id.toString(), settlementEvent],
    queryFn: () => findSettlementTxHash(id, settlementEvent),
    enabled: bounty?.status === "completed" || bounty?.status === "refunded",
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (query.isPending) return <p className="text-muted">Loading bounty…</p>;
  if (query.isError) {
    return <p className="text-danger text-body">{query.error.message}</p>;
  }
  if (!bounty) return null;

  const canSelect = isCreator && (bounty.status === "open" || bounty.status === "under_review");
  const canRefund = isCreator && bounty.status === "expired";
  const canSubmit = bounty.status === "open" && !isCreator;
  const settlementHash: Hash | undefined =
    (bounty.status === "completed" ? selectTx.state.hash : refundTx.state.hash) ?? settlement.data;

  async function onSelect(index: number) {
    const receipt = await selectTx.execute(() => selectWinner(id, index));
    if (receipt) refresh();
  }

  async function onRefund() {
    const receipt = await refundTx.execute(() => refundBounty(id));
    if (receipt) refresh();
  }

  return (
    <div className="fade-in grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={bounty.status} />
            <span className="text-caption text-muted">
              #{bounty.id.toString()} · {bounty.category}
            </span>
          </div>
          <h1 className="text-display font-semibold tracking-tight">{bounty.title}</h1>
          <p className="text-body text-muted whitespace-pre-wrap">{bounty.description}</p>
        </div>

        {bounty.status === "completed" && (
          <Card className="border-status-completed/40 space-y-3">
            <p className="text-caption text-status-completed font-medium">
              Winner selected · reward paid
            </p>
            <p className="text-body">
              <span className="font-mono">{bounty.winner && shortAddress(bounty.winner)}</span>{" "}
              received <span className="font-mono">{formatReward(bounty.rewardAmount)}</span>
            </p>
            <SettlementLink hash={settlementHash} loading={settlement.isFetching} />
          </Card>
        )}

        {bounty.status === "refunded" && (
          <Card className="space-y-3">
            <p className="text-caption text-status-refunded font-medium">Refunded to the creator</p>
            <p className="text-body">
              {formatReward(bounty.rewardAmount)} was returned to {shortAddress(bounty.creator)}.
            </p>
            <SettlementLink hash={settlementHash} loading={settlement.isFetching} />
          </Card>
        )}

        {bounty.status === "expired" && (
          <Card className="text-body text-muted">
            The deadline and review period passed without a winner.
            {isCreator ? " You can reclaim the reward below." : ""}
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-title font-semibold tracking-tight">
            Submissions <span className="text-muted">({bounty.submissions.length})</span>
          </h2>
          {bounty.submissions.length === 0 && (
            <p className="text-body text-muted">No submissions yet.</p>
          )}
          {bounty.submissions.map((submission) => (
            <SubmissionCard
              key={submission.index}
              submission={submission}
              isWinner={sameAddress(bounty.winner, submission.submitter)}
              action={
                canSelect && !isWrongNetwork ? (
                  <Button
                    variant="secondary"
                    onClick={() => onSelect(submission.index)}
                    disabled={busy}
                  >
                    Select winner
                  </Button>
                ) : undefined
              }
            />
          ))}
          <TxStatus state={selectTx.state} label="Select winner" />
        </div>

        {canSubmit &&
          (isConnected ? (
            <SubmitWorkForm bountyId={id} />
          ) : (
            <ConnectPrompt message="Connect a wallet to submit work to this bounty." />
          ))}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <Card className="space-y-5">
          <div>
            <p className="text-caption text-muted">Reward</p>
            <p className="text-title mt-1 font-semibold tracking-tight">
              {formatReward(bounty.rewardAmount)}
            </p>
          </div>
          <div>
            <p className="text-caption text-muted">Submission deadline</p>
            <p className="text-body mt-1">{formatDateTime(bounty.deadline)}</p>
            {bounty.status === "open" && (
              <p className="text-caption text-accent mt-1">
                <Countdown deadline={bounty.deadline} />
              </p>
            )}
          </div>
          <div>
            <p className="text-caption text-muted">Review ends</p>
            <p className="text-body mt-1">{formatDateTime(bounty.reviewEnd)}</p>
          </div>
          <div>
            <p className="text-caption text-muted">Creator</p>
            <a
              href={addressUrl(bounty.creator)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-accent mt-1 inline-block font-mono hover:underline"
            >
              {shortAddress(bounty.creator)} {isCreator ? "(you)" : ""} ↗
            </a>
          </div>
          <div>
            <p className="text-caption text-muted">Winner selection</p>
            <p className="text-body mt-1">Creator selects the winner</p>
          </div>
        </Card>

        {isCreator && canSelect && (
          <p className="text-caption text-muted">
            Pick a submission above to pay it out. Selection closes at the review end time.
          </p>
        )}
        {canRefund && (
          <Card className="space-y-4">
            <p className="text-body">Reclaim the escrowed reward.</p>
            {isWrongNetwork ? (
              <Button onClick={switchToMonadTestnet} disabled={isSwitching} className="w-full">
                Switch to Monad Testnet
              </Button>
            ) : (
              <Button variant="danger" onClick={onRefund} disabled={busy} className="w-full">
                Reclaim reward
              </Button>
            )}
            <TxStatus state={refundTx.state} label="Reclaim reward" />
          </Card>
        )}
        {!isConnected && bounty.status === "open" && (
          <p className="text-caption text-muted">Connect a wallet to participate.</p>
        )}
      </aside>
    </div>
  );
}

function SettlementLink({ hash, loading }: { hash?: Hash; loading: boolean }) {
  if (hash) {
    return (
      <a
        href={txUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption text-accent inline-block font-mono hover:underline"
      >
        {hash.slice(0, 12)}…{hash.slice(-6)} ↗ Monadscan
      </a>
    );
  }
  return (
    <p className="text-caption text-muted">
      {loading
        ? "Looking up the settlement transaction…"
        : "Settlement transaction not found in recent blocks."}
    </p>
  );
}
