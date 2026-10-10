"use client";

import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/ui/tx-status";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { claimTestUsdc } from "@/lib/blockchain/write";

export function FaucetCard() {
  const { isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const busy = state.status === "awaiting_signature" || state.status === "pending";

  async function claim() {
    const receipt = await execute(() => claimTestUsdc());
    if (receipt) refresh();
  }

  return (
    <div className="border-line/80 bg-surface space-y-4 rounded-xl border p-6">
      <div>
        <p className="font-display text-2xl tracking-tight">Need test USDC?</p>
        <p className="text-caption text-muted mt-1">
          Claim 100 test USDC to your wallet. You can claim once every 24 hours.
        </p>
      </div>
      {!isConnected ? null : isWrongNetwork ? (
        <Button onClick={switchToMonadTestnet} disabled={isSwitching}>
          Switch to Monad Testnet
        </Button>
      ) : (
        <Button variant="secondary" onClick={claim} disabled={busy}>
          Claim 100 USDC
        </Button>
      )}
      <TxStatus state={state} label="Claim test USDC" />
    </div>
  );
}
