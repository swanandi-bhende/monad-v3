import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="fade-in border-line bg-surface/60 flex flex-col items-start gap-4 rounded-xl border border-dashed p-10">
      <p className="font-display text-3xl tracking-tight">{title}</p>
      <p className="text-body text-muted max-w-md">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-caption text-muted">{label}</p>
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="border-line/80 bg-surface space-y-4 rounded-xl border p-6">
            <div className="skeleton h-4 w-1/3 rounded-full" />
            <div className="skeleton h-7 w-2/3 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-full" />
            <div className="skeleton h-4 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="fade-in border-danger/25 bg-status-expired-bg/50 flex flex-col items-start gap-4 rounded-xl border p-8">
      <p className="font-display text-3xl tracking-tight">We could not reach the chain</p>
      <p className="text-body text-muted max-w-xl">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
