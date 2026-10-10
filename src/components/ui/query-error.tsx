import { ErrorState } from "@/components/ui/state";

export function QueryError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return <ErrorState error={error} onRetry={onRetry} />;
}
