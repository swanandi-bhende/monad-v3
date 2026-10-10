"use client";

import { useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/ui/tx-status";
import { useNow } from "@/hooks/use-now";
import { useRefreshBounties } from "@/hooks/bounty/use-bounties";
import { useTransaction } from "@/hooks/transaction/use-transaction";
import { useWallet } from "@/hooks/wallet/use-wallet";
import { claimTestUsdc } from "@/lib/blockchain/write";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { TESTUSDC_ABI } from "@/lib/contracts/abi";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import { formatCountdown } from "@/lib/utils/format";

const COOLDOWN_SECONDS = 24 * 60 * 60;

export function FaucetCard() {
  const { address, isConnected, isWrongNetwork, switchToMonadTestnet, isSwitching } = useWallet();
  const { state, execute } = useTransaction();
  const refresh = useRefreshBounties();
  const now = useNow();
  const busy = state.status === "awaiting_signature" || state.status === "pending";

  const lastClaim = useQuery({
    queryKey: ["faucet-last-claim", address],
    enabled: isConnected && !isWrongNetwork && !!address,
    queryFn: async () =>
      Number(
        await readContract(wagmiConfig, {
          address: REWARD_TOKEN.address,
          abi: TESTUSDC_ABI,
          functionName: "lastClaimAt",
          args: [address!],
        }),
      ),
    refetchInterval: 15_000,
  });

  const nowSeconds = Math.floor(now / 1000);
  const availableAt = lastClaim.data ? lastClaim.data + COOLDOWN_SECONDS : 0;
  const waitSeconds = availableAt > nowSeconds ? availableAt - nowSeconds : 0;
  const cooling = waitSeconds > 0;

  async function claim() {
    const receipt = await execute(() => claimTestUsdc());
    if (receipt) {
      lastClaim.refetch();
      refresh();
    }
  }

  return (
    <div className="glass bg-surface space-y-4 rounded-md border border-white p-6">
      <div>
        <p className="font-display text-2xl font-bold tracking-tight">Need test USDC?</p>
        <p className="text-caption text-muted mt-1">
          Claim 100 test USDC to your wallet once every 24 hours.
        </p>
      </div>
      {!isConnected ? (
        <p className="text-caption text-muted">Connect a wallet to claim.</p>
      ) : isWrongNetwork ? (
        <Button onClick={switchToMonadTestnet} disabled={isSwitching}>
          Switch to Monad Testnet
        </Button>
      ) : (
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={claim}
            disabled={busy || cooling || lastClaim.isPending}
          >
            {cooling
              ? `Next claim in ${formatCountdown(waitSeconds).replace(" left", "")}`
              : "Claim 100 USDC"}
          </Button>
          {lastClaim.isError && (
            <p className="text-caption text-danger">
              Could not read your last claim. Retry in a moment.
            </p>
          )}
        </div>
      )}
      <TxStatus state={state} label="Claim test USDC" />
    </div>
  );
}
