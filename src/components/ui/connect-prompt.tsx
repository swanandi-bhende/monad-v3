"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/wallet/use-wallet";

export function ConnectPrompt({ message }: { message: string }) {
  const { connect, isConnecting } = useWallet();
  return (
    <Card className="flex flex-col items-start gap-4">
      <p className="text-body text-muted">{message}</p>
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </Button>
    </Card>
  );
}
