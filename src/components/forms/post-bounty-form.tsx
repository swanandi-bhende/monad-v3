"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BOUNTY_CATEGORIES, SELECTION_METHODS } from "@/constants/bounty";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { Field, inputClass } from "@/components/ui/field";
import { TxStatus } from "@/components/ui/tx-status";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { bountyIdFromReceipt } from "@/lib/blockchain/transaction";
import { approveSpend, createBounty, needsApproval } from "@/lib/blockchain/write";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import { parseAmount } from "@/lib/utils/validate";

const EMPTY_FORM = {
  title: "",
  description: "",
  reward: "",
  deadline: "",
  category: BOUNTY_CATEGORIES[0],
  selectionMethod: SELECTION_METHODS[0].value,
};

export function PostBountyForm() {
  const router = useRouter();
  const { isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState<"approve" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected) return <ConnectPrompt message="Connect a wallet to post and fund a bounty." />;

  const busy = step !== null;

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const reward = parseAmount(form.reward, REWARD_TOKEN.decimals);
    if (!form.title.trim() || !form.description.trim()) {
      setError("Add a title and a description.");
      return;
    }
    if (!reward) {
      setError(`Enter a reward above 0 with at most ${REWARD_TOKEN.decimals} decimals.`);
      return;
    }
    const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);
    if (!Number.isFinite(deadline) || deadline < Date.now() / 1000 + 60) {
      setError("Choose a deadline at least one minute from now.");
      return;
    }

    try {
      setStep("approve");
      if (await needsApproval(REWARD_TOKEN.address, reward)) {
        const approved = await execute(() => approveSpend(REWARD_TOKEN.address, reward));
        if (!approved) return;
      }

      setStep("create");
      const receipt = await execute(() =>
        createBounty({
          token: REWARD_TOKEN.address,
          reward,
          deadline,
          metadata: {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            selectionMethod: form.selectionMethod,
          },
        }),
      );
      if (!receipt) return;

      const bountyId = bountyIdFromReceipt(receipt);
      refresh();
      router.push(`/bounty/${bountyId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the bounty.");
    } finally {
      setStep(null);
    }
  }

  const stepLabel =
    step === "approve" ? "Approve tUSD" : step === "create" ? "Create bounty" : undefined;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-5">
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            className={inputClass}
            maxLength={120}
            placeholder="Find a reproducible bug in the demo app"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="description"
          hint="Describe the task and what counts as done."
        >
          <textarea
            id="description"
            rows={7}
            className={inputClass}
            placeholder="Steps, expected output, and how the creator will judge submissions."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={busy}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Reward (${REWARD_TOKEN.symbol})`} htmlFor="reward">
            <input
              id="reward"
              inputMode="decimal"
              className={`${inputClass} font-mono`}
              placeholder="5"
              value={form.reward}
              onChange={(e) => update("reward", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Deadline" htmlFor="deadline" hint="Submissions close at this time.">
            <input
              id="deadline"
              type="datetime-local"
              className={inputClass}
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Category" htmlFor="category">
            <select
              id="category"
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              disabled={busy}
            >
              {BOUNTY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Winner selection" htmlFor="selection">
            <select id="selection" className={inputClass} value={form.selectionMethod} disabled>
              {SELECTION_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="space-y-4">
          <p className="text-caption text-muted">Escrow</p>
          <p className="text-title font-semibold tracking-tight">
            {form.reward || "0"} {REWARD_TOKEN.symbol}
          </p>
          <p className="text-caption text-muted">
            The reward is locked in the ProofBounty contract when you create the bounty. If no
            winner is selected by the review deadline, you can reclaim it.
          </p>
          {isWrongNetwork ? (
            <Button onClick={switchToMonadTestnet} disabled={isSwitching} className="w-full">
              Switch to Monad Testnet
            </Button>
          ) : (
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Processing…" : "Create and fund bounty"}
            </Button>
          )}
        </Card>
        {error && <p className="text-caption text-danger">{error}</p>}
        <TxStatus state={state} label={stepLabel} />
      </aside>
    </form>
  );
}
