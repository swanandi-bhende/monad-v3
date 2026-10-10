import { parseEventLogs, type Hash, type TransactionReceipt } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { GIGACHAD_ABI } from "@/lib/contracts/abi";
import { MONAD_TESTNET } from "@/lib/config/chain";

export function waitForTx(hash: Hash): Promise<TransactionReceipt> {
  return waitForTransactionReceipt(wagmiConfig, { hash });
}

export function txUrl(hash: Hash) {
  return `${MONAD_TESTNET.blockExplorers.default.url}/tx/${hash}`;
}

export function addressUrl(address: string) {
  return `${MONAD_TESTNET.blockExplorers.default.url}/address/${address}`;
}

export function bountyIdFromReceipt(receipt: TransactionReceipt) {
  const [event] = parseEventLogs({
    abi: GIGACHAD_ABI,
    logs: receipt.logs,
    eventName: "BountyCreated",
  });
  if (!event) throw new Error("BountyCreated event not found in the transaction receipt.");
  return event.args.bountyId;
}
