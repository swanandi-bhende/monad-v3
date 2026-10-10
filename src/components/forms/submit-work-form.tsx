"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { TxStatus } from "@/components/ui/tx-status";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { submitWork } from "@/lib/blockchain/write";
import {
  encodeEvidence,
  LINK_KIND_LABEL,
  type EvidenceFile,
  type EvidenceLink,
} from "@/lib/utils/evidence";

const LINK_KINDS: EvidenceLink["kind"][] = ["github", "demo", "figma", "other"];

export function SubmitWorkForm({ bountyId }: { bountyId: bigint }) {
  const { switchToMonadTestnet, isSwitching, isWrongNetwork } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const [text, setText] = useState("");
  const [links, setLinks] = useState<Record<EvidenceLink["kind"], string>>({
    github: "",
    demo: "",
    figma: "",
    other: "",
  });
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = uploading || state.status === "awaiting_signature" || state.status === "pending";

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as EvidenceFile & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "The file could not be uploaded.");
      setFiles((current) => [...current, { name: data.name, cid: data.cid, url: data.url }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!text.trim()) return setError("Explain what you built and how it meets the deliverables.");

    const invalid = LINK_KINDS.find(
      (kind) => links[kind] && !/^https?:\/\//.test(links[kind].trim()),
    );
    if (invalid)
      return setError(`The ${LINK_KIND_LABEL[invalid]} link must start with http:// or https://.`);

    const receipt = await execute(() =>
      submitWork(
        bountyId,
        encodeEvidence({
          text: text.trim(),
          links: LINK_KINDS.map((kind) => ({ kind, url: links[kind].trim() })).filter(
            (link) => link.url,
          ),
          files,
        }),
      ),
    );
    if (receipt) {
      setText("");
      setLinks({ github: "", demo: "", figma: "", other: "" });
      setFiles([]);
      refresh();
    }
  }

  return (
    <Card className="space-y-7">
      <div>
        <h2 className="font-display text-title tracking-tight">Submit your work</h2>
        <p className="text-caption text-muted mt-1">
          The explanation and links are stored on-chain with your submission. Files are stored
          off-chain on IPFS and referenced by their content ID.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <Field
          label="Overview"
          htmlFor="work"
          hint="What you built, how it meets the deliverables, and anything a reviewer should know."
        >
          <textarea
            id="work"
            rows={5}
            className={inputClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
        </Field>

        <div className="space-y-4">
          <p className="text-body font-medium">Links</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {LINK_KINDS.map((kind) => (
              <Field key={kind} label={LINK_KIND_LABEL[kind]} htmlFor={`link-${kind}`}>
                <input
                  id={`link-${kind}`}
                  type="url"
                  className={inputClass}
                  placeholder="https://"
                  value={links[kind]}
                  onChange={(e) => setLinks((current) => ({ ...current, [kind]: e.target.value }))}
                  disabled={busy}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-body font-medium">Files</p>
          <label className="text-body border-line bg-canvas hover:border-ink/40 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed px-5 py-4 transition-colors">
            <span className="text-muted">
              {uploading ? "Uploading to IPFS…" : "Add a PDF, image, or ZIP (up to 25 MB)"}
            </span>
            <span className="rounded-pill bg-ink text-caption text-canvas px-4 py-2">
              Choose file
            </span>
            <input type="file" className="sr-only" onChange={upload} disabled={busy} />
          </label>
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.cid}
                  className="text-caption bg-canvas flex items-center justify-between gap-4 rounded-lg px-4 py-2.5"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-muted hover:text-ink"
                    onClick={() => setFiles((current) => current.filter((f) => f.cid !== file.cid))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-caption text-danger">{error}</p>}
        <TxStatus state={state} label="Submit work" />
        {isWrongNetwork ? (
          <Button onClick={switchToMonadTestnet} disabled={isSwitching}>
            Switch to Monad Testnet
          </Button>
        ) : (
          <Button type="submit" className="px-6 py-3" disabled={busy}>
            {busy ? "Working…" : "Submit work"}
          </Button>
        )}
      </form>
    </Card>
  );
}
