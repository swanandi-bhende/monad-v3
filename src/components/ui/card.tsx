import type { ReactNode } from "react";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`fade-in border-line bg-surface rounded-lg border p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <p className="text-caption text-muted">{label}</p>
      <p className="text-title mt-2 font-semibold tracking-tight">{value}</p>
    </Card>
  );
}
