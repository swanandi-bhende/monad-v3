"use client";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import type { RubricCriterion } from "@/types/bounty";

export function RubricBuilder({
  criteria,
  disabled,
  onChange,
}: {
  criteria: RubricCriterion[];
  disabled: boolean;
  onChange: (next: RubricCriterion[]) => void;
}) {
  const total = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const valid = total === 100 && criteria.length > 0 && criteria.every((c) => c.name.trim());

  function update(index: number, patch: Partial<RubricCriterion>) {
    onChange(
      criteria.map((criterion, i) => (i === index ? { ...criterion, ...patch } : criterion)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-center">
            <input
              aria-label={`Criterion ${index + 1} name`}
              className={inputClass}
              value={criterion.name}
              placeholder="Criterion name"
              disabled={disabled}
              onChange={(e) => update(index, { name: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                aria-label={`Criterion ${index + 1} weight`}
                type="number"
                min={0}
                max={100}
                className={`${inputClass} font-mono`}
                value={criterion.weight}
                disabled={disabled}
                onChange={(e) => update(index, { weight: Number(e.target.value) })}
              />
              <span className="text-caption text-muted">%</span>
            </div>
            <Button
              variant="ghost"
              className="px-3 py-2"
              disabled={disabled || criteria.length <= 1}
              onClick={() => onChange(criteria.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="secondary"
          disabled={disabled || criteria.length >= 10}
          onClick={() => onChange([...criteria, { name: "", weight: 0 }])}
        >
          Add criterion
        </Button>
        <p className={`text-caption font-medium ${valid ? "text-ink" : "text-muted"}`}>
          Weights total {total}% {valid ? "· ready" : "· must total 100%"}
        </p>
      </div>

      <div className="border-line bg-canvas space-y-3 rounded-lg border p-5">
        <p className="text-caption text-muted tracking-wider uppercase">
          Live preview · what reviewers score
        </p>
        {criteria
          .filter((c) => c.name.trim())
          .map((criterion) => (
            <div key={criterion.name} className="space-y-1.5">
              <div className="text-body flex justify-between">
                <span>{criterion.name}</span>
                <span className="font-mono">{criterion.weight}%</span>
              </div>
              <div className="bg-line h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-ink h-full rounded-full"
                  style={{ width: `${Math.min(criterion.weight, 100)}%` }}
                />
              </div>
            </div>
          ))}
        {criteria.every((c) => !c.name.trim()) && (
          <p className="text-caption text-muted">Add criteria to see the preview.</p>
        )}
      </div>
    </div>
  );
}
