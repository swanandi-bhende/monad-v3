import { erc20Abi, type Address, type Hash } from "viem";
import { getAccount, readContract, writeContract } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { GIGACHAD_ABI, TESTUSDC_ABI } from "@/lib/contracts/abi";
import { getEscrowAddress } from "@/lib/contracts/addresses";
import { REWARD_TOKEN } from "@/lib/config/tokens";
import type { BountyMetadata } from "@/types/bounty";

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
    args: [connectedAccount(), getEscrowAddress()],
  });
  return allowance < amount;
}

export function approveSpend(token: Address, amount: bigint): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [getEscrowAddress(), amount],
  });
}

export function claimTestUsdc(): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: REWARD_TOKEN.address,
    abi: TESTUSDC_ABI,
    functionName: "claim",
  });
}

export function createBounty(input: {
  token: Address;
  reward: bigint;
  deadline: number;
  reviewSlots: number;
  metadata: BountyMetadata;
}): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "createBounty",
    args: [
      input.token,
      input.reward,
      BigInt(input.deadline),
      input.reviewSlots,
      JSON.stringify(input.metadata),
    ],
  });
}

export function submitWork(bountyId: bigint, evidence: string): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "submitWork",
    args: [bountyId, evidence],
  });
}

export function submitReview(bountyId: bigint, scores: number[], feedback: string): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "submitReview",
    args: [bountyId, scores, feedback],
  });
}

export function selectWinner(bountyId: bigint, submissionIndex: number): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "selectWinner",
    args: [bountyId, BigInt(submissionIndex)],
  });
}

export function refundBounty(bountyId: bigint): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "refund",
    args: [bountyId],
  });
}
