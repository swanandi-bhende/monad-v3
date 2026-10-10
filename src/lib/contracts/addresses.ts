import type { Address } from "viem";
import { env } from "@/lib/config/env";

export function getProofBountyAddress(): Address {
  if (!env.proofBountyAddress) {
    throw new Error(
      "NEXT_PUBLIC_PROOFBOUNTY_ADDRESS is not set. Deploy ProofBounty and add its address to .env.local.",
    );
  }
  return env.proofBountyAddress;
}

export function getCredibilityAddress(): Address {
  if (!env.credibilityAddress) {
    throw new Error(
      "NEXT_PUBLIC_CREDIBILITY_ADDRESS is not set. Deploy SubmissionCredibility first.",
    );
  }
  return env.credibilityAddress;
}
