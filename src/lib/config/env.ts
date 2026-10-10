import { isAddress, type Address } from "viem";
import { MONAD_TESTNET_RPC_URL } from "@/lib/config/chain";

function readUrl(value: string | undefined, fallback: string, name: string) {
  const url = value?.trim() || fallback;
  try {
    new URL(url);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  return url;
}

function readAddress(value: string | undefined, name: string): Address | undefined {
  const address = value?.trim();
  if (!address) return undefined;
  if (!isAddress(address)) throw new Error(`${name} must be a valid 0x address`);
  return address;
}

export const env = {
  monadRpcUrl: readUrl(
    process.env.NEXT_PUBLIC_MONAD_RPC_URL,
    MONAD_TESTNET_RPC_URL,
    "NEXT_PUBLIC_MONAD_RPC_URL",
  ),
  proofBountyAddress: readAddress(
    process.env.NEXT_PUBLIC_PROOFBOUNTY_ADDRESS,
    "NEXT_PUBLIC_PROOFBOUNTY_ADDRESS",
  ),
};
