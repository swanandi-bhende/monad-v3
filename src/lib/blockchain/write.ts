import { erc20Abi, type Address, type Hash } from "viem";
import { getAccount, readContract, writeContract } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { CREDIBILITY_ABI, PROOFBOUNTY_ABI } from "@/lib/contracts/abi";
import { getCredibilityAddress, getProofBountyAddress } from "@/lib/contracts/addresses";
import type { BountyMetadata } from "@/types/bounty";

const SIGNAL_CODE = { credible: 1, low_quality: 2 } as const;

export function connectedAccount(): Address {
  const address = getAccount(wagmiConfig).address;
  if (!address) throw new Error("Connect a wallet first");
  return address;
}

export async function needsApproval(token: Address, amount: bigint) {
  const allowance = await readContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [connectedAccount(), getProofBountyAddress()],
  });
  return allowance < amount;
}

export function approveSpend(token: Address, amount: bigint): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [getProofBountyAddress(), amount],
  });
}

export function createBounty(input: {
  token: Address;
  reward: bigint;
  deadline: number;
  metadata: BountyMetadata;
}): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "createBounty",
    args: [input.token, input.reward, BigInt(input.deadline), JSON.stringify(input.metadata)],
  });
}

export function submitWork(bountyId: bigint, evidence: string): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "submitWork",
    args: [bountyId, evidence],
  });
}

export function selectWinner(bountyId: bigint, submissionIndex: number): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "selectWinner",
    args: [bountyId, BigInt(submissionIndex)],
  });
}

export function refundBounty(bountyId: bigint): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "refund",
    args: [bountyId],
  });
}

export function markSubmission(
  bountyId: bigint,
  submissionIndex: number,
  signal: keyof typeof SIGNAL_CODE,
): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getCredibilityAddress(),
    abi: CREDIBILITY_ABI,
    functionName: "mark",
    args: [bountyId, BigInt(submissionIndex), SIGNAL_CODE[signal]],
  });
}
