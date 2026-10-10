import type { ReactNode } from "react";

export const inputClass =
  "text-body w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted/70 transition-colors hover:border-ink/25 focus:border-ink focus:outline-none focus:ring-4 focus:ring-accent/40 disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-body text-ink block font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}
