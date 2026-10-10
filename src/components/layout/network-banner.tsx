"use client";

import { MONAD_TESTNET } from "@/lib/config/chain";
import { useWallet } from "@/hooks/wallet/use-wallet";

export function NetworkBanner() {
  const { isWrongNetwork, isSwitching, switchToMonadTestnet } = useWallet();

  if (!isWrongNetwork) return null;

  return (
    <div role="alert" className="border-line bg-status-review-bg text-status-review border-b">
      <div className="text-caption mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2">
        <p>
          Your wallet is on the wrong network. Switch to {MONAD_TESTNET.name} (chain{" "}
          {MONAD_TESTNET.id}) to use ProofBounty.
        </p>
        <button
          type="button"
          onClick={switchToMonadTestnet}
          disabled={isSwitching}
          className="bg-status-review text-surface shrink-0 rounded-sm px-3 py-1 font-medium disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : "Switch network"}
        </button>
      </div>
    </div>
  );
}
