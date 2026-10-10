import type { Address } from "viem";
import { env } from "@/lib/config/env";

export function getEscrowAddress(): Address {
  if (!env.escrowAddress) {
    throw new Error(
      "NEXT_PUBLIC_GIGACHAD_ADDRESS is not set. Deploy GigAChad and add its address to .env.local.",
    );
  }
  return env.escrowAddress;
}
