"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet/use-wallet";

export function ConnectPrompt({ message }: { message: string }) {
  const { connect, isConnecting } = useWallet();
  return (
    <div className="fade-in bg-ink text-canvas flex flex-col items-start gap-5 rounded-xl p-8">
      <p className="font-display text-3xl tracking-tight">Connect your wallet</p>
      <p className="text-body text-canvas/70 max-w-md">{message}</p>
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting…" : "Connect wallet"}
        <span aria-hidden>→</span>
      </Button>
    </div>
  );
}
