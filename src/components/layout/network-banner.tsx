"use client";

import { Button } from "@/components/ui/button";
import { MONAD_TESTNET } from "@/lib/config/chain";
import { useWallet } from "@/hooks/wallet/use-wallet";

export function NetworkBanner() {
  const { isWrongNetwork, isSwitching, switchToMonadTestnet } = useWallet();

  if (!isWrongNetwork) return null;

  return (
    <div role="alert" className="bg-ink text-canvas">
      <div className="text-body mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <p>
          Your wallet is on the wrong network. Switch to {MONAD_TESTNET.name} (chain{" "}
          {MONAD_TESTNET.id}) to use Gig-a-Chad.
        </p>
        <Button
          variant="dark"
          onClick={switchToMonadTestnet}
          disabled={isSwitching}
          className="shrink-0 px-4 py-2"
        >
          {isSwitching ? "Switching…" : "Switch network"}
        </Button>
      </div>
    </div>
  );
}
