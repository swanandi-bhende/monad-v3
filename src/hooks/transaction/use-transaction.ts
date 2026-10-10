import { useCallback, useState } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { waitForTx } from "@/lib/blockchain/transaction";
import type { TransactionState } from "@/types/transaction";

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/user (rejected|denied)/i.test(message)) return "Transaction was rejected in your wallet.";
  if (error instanceof Error && "shortMessage" in error && typeof error.shortMessage === "string") {
    return error.shortMessage;
  }
  return message;
}

export function useTransaction() {
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const execute = useCallback(async (send: () => Promise<Hash>) => {
    setState({ status: "awaiting_signature" });
    let hash: Hash | undefined;
    try {
      hash = await send();
      setState({ status: "pending", hash });
      const receipt: TransactionReceipt = await waitForTx(hash);
      if (receipt.status !== "success") {
        setState({ status: "failed", hash, error: "The transaction reverted on-chain." });
        return null;
      }
      setState({ status: "confirmed", hash });
      return receipt;
    } catch (error) {
      setState({ status: "failed", hash, error: errorMessage(error) });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, execute, reset };
}
