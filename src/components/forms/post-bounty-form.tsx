"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EconomicsPanel } from "@/components/bounty/economics-panel";
import { FaucetCard } from "@/components/forms/faucet-card";
import { RubricBuilder } from "@/components/forms/rubric-builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectPrompt } from "@/components/ui/connect-prompt";
import { Field, inputClass } from "@/components/ui/field";
import { TxStatus } from "@/components/ui/tx-status";
import { BOUNTY_CATEGORIES } from "@/constants/bounty";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { bountyIdFromReceipt } from "@/lib/blockchain/transaction";
import { approveSpend, createBounty, needsApproval } from "@/lib/blockchain/write";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import type { RubricCriterion } from "@/types/bounty";
import { parseAmount } from "@/lib/utils/validate";

const DEFAULT_RUBRIC: RubricCriterion[] = [
  { name: "Visual quality", weight: 30 },
  { name: "Requirement fulfillment", weight: 30 },
  { name: "Technical quality", weight: 20 },
  { name: "Mobile responsiveness", weight: 10 },
  { name: "Documentation", weight: 10 },
];

const PRESETS = [
  { label: "+ 10 min", minutes: 10 },
  { label: "+ 1 hour", minutes: 60 },
  { label: "+ 1 day", minutes: 24 * 60 },
  { label: "+ 3 days", minutes: 3 * 24 * 60 },
];

function presetParts(minutes: number) {
  return localParts(new Date(Date.now() + minutes * 60_000));
}

function localParts(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

const EMPTY = {
  title: "",
  description: "",
  category: BOUNTY_CATEGORIES[0],
  reward: "",
  deadlineDate: "",
  deadlineTime: "",
  reviewSlots: "3",
  deliverables: "",
  acceptanceCriteria: "",
  submissionInstructions: "",
  tools: "",
};

export function PostBountyForm() {
  const router = useRouter();
  const { isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const [form, setForm] = useState(EMPTY);
  const [rubric, setRubric] = useState<RubricCriterion[]>(DEFAULT_RUBRIC);
  const [step, setStep] = useState<"approve" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected)
    return (
      <ConnectPrompt message="Connect a wallet to post a bounty and fund it from your USDC balance." />
    );

  const busy = step !== null;
  const reward = parseAmount(form.reward, REWARD_TOKEN.decimals);

  function update<K extends keyof typeof EMPTY>(field: K, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyPreset(minutes: number) {
    const parts = presetParts(minutes);
    setForm((current) => ({ ...current, deadlineDate: parts.date, deadlineTime: parts.time }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.description.trim())
      return setError("Add a title and a description.");
    if (!form.deliverables.trim()) return setError("Say exactly what must be submitted.");
    if (!form.acceptanceCriteria.trim()) return setError("Define what makes a submission valid.");
    if (!reward)
      return setError(`Enter a reward above 0 with at most ${REWARD_TOKEN.decimals} decimals.`);
    const slots = Number(form.reviewSlots);
    if (!Number.isInteger(slots) || slots < 1 || slots > 10)
      return setError("Reviewer slots must be between 1 and 10.");
    const totalWeight = rubric.reduce((sum, c) => sum + c.weight, 0);
    if (rubric.some((c) => !c.name.trim()) || totalWeight !== 100)
      return setError("Rubric criteria need names and weights that total 100%.");
    const deadline = Math.floor(
      new Date(`${form.deadlineDate}T${form.deadlineTime}`).getTime() / 1000,
    );
    if (!Number.isFinite(deadline) || deadline < Date.now() / 1000 + 60)
      return setError("Choose a deadline at least one minute from now.");

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
          reviewSlots: slots,
          metadata: {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            selectionMethod: "manual",
            deliverables: form.deliverables.trim(),
            acceptanceCriteria: form.acceptanceCriteria.trim(),
            submissionInstructions: form.submissionInstructions.trim(),
            tools: form.tools
              .split(",")
              .map((tool) => tool.trim())
              .filter(Boolean),
            rubric: rubric.map((c) => ({ name: c.name.trim(), weight: c.weight })),
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
    step === "approve" ? "Approve USDC" : step === "create" ? "Create bounty" : undefined;

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <Card className="space-y-6">
          <h2 className="font-display text-title tracking-tight">The task</h2>
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              className={inputClass}
              maxLength={120}
              placeholder="Redesign the pricing page for mobile"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Summary" htmlFor="description">
            <textarea
              id="description"
              rows={3}
              className={inputClass}
              placeholder="What the work is and why it matters."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              disabled={busy}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
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
            <Field label="Tools (comma separated)" htmlFor="tools">
              <input
                id="tools"
                className={inputClass}
                placeholder="Figma, React, Tailwind"
                value={form.tools}
                onChange={(e) => update("tools", e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-6">
          <h2 className="font-display text-title tracking-tight">Deliverables and acceptance</h2>
          <Field
            label="What exactly must be submitted?"
            htmlFor="deliverables"
            hint="Files, links, screenshots, or a repository. Be specific."
          >
            <textarea
              id="deliverables"
              rows={3}
              className={inputClass}
              placeholder="A Figma file, a deployed preview link, and a short README."
              value={form.deliverables}
              onChange={(e) => update("deliverables", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field
            label="What makes a submission valid?"
            htmlFor="acceptance"
            hint="Everything that must be present for a submission to qualify."
          >
            <textarea
              id="acceptance"
              rows={3}
              className={inputClass}
              placeholder="Works on 390px width. No console errors. Matches the attached brand colours."
              value={form.acceptanceCriteria}
              onChange={(e) => update("acceptanceCriteria", e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Submission instructions" htmlFor="instructions">
            <textarea
              id="instructions"
              rows={2}
              className={inputClass}
              placeholder="Add the preview link and the Figma link in the Links section."
              value={form.submissionInstructions}
              onChange={(e) => update("submissionInstructions", e.target.value)}
              disabled={busy}
            />
          </Field>
        </Card>

        <Card className="space-y-6">
          <div>
            <h2 className="font-display text-title tracking-tight">Evaluation rubric</h2>
            <p className="text-caption text-muted mt-1">
              Reviewers score every submission against these criteria. Weights must total 100%.
            </p>
          </div>
          <RubricBuilder criteria={rubric} disabled={busy} onChange={setRubric} />
        </Card>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <Card className="space-y-6">
          <div className="space-y-4">
            <Field label={`Reward (${REWARD_TOKEN.symbol})`} htmlFor="reward">
              <input
                id="reward"
                inputMode="decimal"
                className={`${inputClass} font-mono`}
                placeholder="10"
                value={form.reward}
                onChange={(e) => update("reward", e.target.value)}
                disabled={busy}
              />
            </Field>
            <div className="space-y-3">
              <p className="text-body font-medium">Deadline</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  aria-label="Deadline date"
                  type="date"
                  className={inputClass}
                  value={form.deadlineDate}
                  onChange={(e) => update("deadlineDate", e.target.value)}
                  disabled={busy}
                />
                <input
                  aria-label="Deadline time"
                  type="time"
                  className={inputClass}
                  value={form.deadlineTime}
                  onChange={(e) => update("deadlineTime", e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={busy}
                    onClick={() => applyPreset(preset.minutes)}
                    className="text-caption rounded-pill border-line text-muted hover:text-ink border px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label="Reviewer slots"
              htmlFor="slots"
              hint="How many people review each submission set. 10% of the reward is split between them."
            >
              <input
                id="slots"
                type="number"
                min={1}
                max={10}
                className={`${inputClass} font-mono`}
                value={form.reviewSlots}
                onChange={(e) => update("reviewSlots", e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>
          <div className="border-line border-t pt-6">
            <p className="text-caption text-muted mb-4 tracking-wider uppercase">
              Where the money goes
            </p>
            <EconomicsPanel reward={reward ?? BigInt(0)} />
          </div>
          {isWrongNetwork ? (
            <Button onClick={switchToMonadTestnet} disabled={isSwitching} className="w-full">
              Switch to Monad Testnet
            </Button>
          ) : (
            <Button type="submit" className="w-full py-3.5" disabled={busy || !reward}>
              {busy ? "Processing…" : "Create and fund bounty"}
            </Button>
          )}
          {error && <p className="text-caption text-danger">{error}</p>}
          <TxStatus state={state} label={stepLabel} />
        </Card>
        <FaucetCard />
      </aside>
    </form>
  );
}
