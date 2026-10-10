import type { ReactNode } from "react";

export const inputClass =
  "text-body w-full rounded-md border border-line bg-canvas px-3 py-2 text-ink placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none disabled:opacity-50";

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
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-caption text-ink block font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}
