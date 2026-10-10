"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { TxStatus } from "@/components/ui/tx-status";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { submitWork } from "@/lib/blockchain/write";
import { encodeEvidence } from "@/lib/utils/evidence";

export function SubmitWorkForm({ bountyId }: { bountyId: bigint }) {
  const { switchToMonadTestnet, isSwitching, isWrongNetwork } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const busy = state.status === "awaiting_signature" || state.status === "pending";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Describe the work you are submitting.");
      return;
    }
    if (url && !/^https?:\/\//.test(url.trim())) {
      setError("The evidence link must start with http:// or https://.");
      return;
    }

    const receipt = await execute(() =>
      submitWork(bountyId, encodeEvidence({ text: text.trim(), url: url.trim() || undefined })),
    );
    if (receipt) {
      setText("");
      setUrl("");
      refresh();
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-title font-semibold tracking-tight">Submit your work</h2>
        <p className="text-caption text-muted mt-1">
          Submissions are recorded on-chain and visible to everyone until the deadline.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Work description" htmlFor="work">
          <textarea
            id="work"
            rows={5}
            className={inputClass}
            placeholder="What you did, how to reproduce it, and what you found."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field
          label="Evidence link (optional)"
          htmlFor="evidence"
          hint="A repo, gist, video, or document."
        >
          <input
            id="evidence"
            type="url"
            className={inputClass}
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
        </Field>
        {error && <p className="text-caption text-danger">{error}</p>}
        <TxStatus state={state} label="Submit work" />
        {isWrongNetwork ? (
          <Button onClick={switchToMonadTestnet} disabled={isSwitching}>
            Switch to Monad Testnet
          </Button>
        ) : (
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit work"}
          </Button>
        )}
      </form>
    </Card>
  );
}
