import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QueryError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-start gap-4">
      <div>
        <p className="text-body text-danger font-medium">Could not load data from Monad Testnet</p>
        <p className="text-caption text-muted mt-1">{error.message}</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </Card>
  );
}
