import type { ReactNode } from "react";

export function Card({
  className = "",
  interactive = false,
  children,
}: {
  className?: string;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`fade-in border-line/80 bg-surface rounded-xl border p-6 ${
        interactive
          ? "hover:border-ink/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgb(84_35_68/0.25)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <p className="text-caption text-muted">{label}</p>
      <p className="font-display mt-3 text-5xl leading-none tracking-tight">{value}</p>
    </Card>
  );
}
