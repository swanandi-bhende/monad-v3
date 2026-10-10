import { useCallback, useState } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { getBalance, getChainId } from "wagmi/actions";
import { connectedAccount } from "@/lib/blockchain/write";
import { classifyTxError } from "@/lib/blockchain/errors";
import { waitForTx } from "@/lib/blockchain/transaction";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { MIN_GAS_BALANCE_WEI, MONAD_TESTNET } from "@/lib/config/chain";
import type { TransactionState } from "@/types/transaction";

export function useTransaction() {
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const execute = useCallback(async (send: () => Promise<Hash>) => {
    setState({ status: "awaiting_signature" });
    let hash: Hash | undefined;
    try {
      if (getChainId(wagmiConfig) !== MONAD_TESTNET.id) {
        setState({
          status: "failed",
          error: "Switch your wallet to Monad Testnet to continue.",
          errorKind: "wrong_network",
        });
        return null;
      }

      const balance = await getBalance(wagmiConfig, { address: connectedAccount() });
      if (balance.value < MIN_GAS_BALANCE_WEI) {
        setState({
          status: "failed",
          error:
            "Your wallet needs at least 0.01 MON to pay for gas. Get testnet MON from the faucet.",
          errorKind: "insufficient_funds",
        });
        return null;
      }

      hash = await send();
      setState({ status: "pending", hash });
      const receipt: TransactionReceipt = await waitForTx(hash);
      if (receipt.status !== "success") {
        setState({
          status: "failed",
          hash,
          error: "The transaction was mined but reverted on-chain. Nothing changed.",
          errorKind: "contract_revert",
        });
        return null;
      }
      setState({ status: "confirmed", hash });
      return receipt;
    } catch (error) {
      const { kind, message } = classifyTxError(error);
      setState({ status: "failed", hash, error: message, errorKind: kind });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, execute, reset };
}
