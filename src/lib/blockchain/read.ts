import { zeroAddress } from "viem";
import { getPublicClient, readContract } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { PROOFBOUNTY_ABI } from "@/lib/contracts/abi";
import { getProofBountyAddress } from "@/lib/contracts/proofbounty";
import type { Bounty, BountyMetadata, BountyStatus, BountyWithSubmissions } from "@/types/bounty";
import type { Submission } from "@/types/submission";

const RAW_STATUS_COMPLETED = 1;
const RAW_STATUS_REFUNDED = 2;

function parseMetadata(raw: string): BountyMetadata {
  try {
    return JSON.parse(raw) as BountyMetadata;
  } catch {
    return {
      title: "Untitled bounty",
      description: "",
      category: "Other",
      selectionMethod: "manual",
    };
  }
}

function deriveStatus(raw: number, deadline: number, reviewEnd: number, now: number): BountyStatus {
  if (raw === RAW_STATUS_COMPLETED) return "completed";
  if (raw === RAW_STATUS_REFUNDED) return "refunded";
  if (now <= deadline) return "open";
  if (now < reviewEnd) return "under_review";
  return "expired";
}

export function readBountyCount() {
  return readContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "bountyCount",
  });
}

export async function readBounty(id: bigint): Promise<Bounty> {
  const [creator, token, reward, deadline, reviewEnd, rawStatus, winner, metadata] =
    await readContract(wagmiConfig, {
      address: getProofBountyAddress(),
      abi: PROOFBOUNTY_ABI,
      functionName: "bounties",
      args: [id],
    });

  const deadlineSeconds = Number(deadline);
  const reviewEndSeconds = Number(reviewEnd);
  const now = Math.floor(Date.now() / 1000);

  return {
    ...parseMetadata(metadata),
    id,
    creator,
    rewardToken: token,
    rewardAmount: reward,
    deadline: deadlineSeconds,
    reviewEnd: reviewEndSeconds,
    status: deriveStatus(Number(rawStatus), deadlineSeconds, reviewEndSeconds, now),
    winner: winner === zeroAddress ? undefined : winner,
  };
}

export async function readSubmissions(bountyId: bigint): Promise<Submission[]> {
  const submissions = await readContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "getSubmissions",
    args: [bountyId],
  });

  return submissions.map((submission, index) => ({
    bountyId,
    index,
    submitter: submission.submitter,
    evidence: submission.evidence,
    submittedAt: Number(submission.submittedAt),
  }));
}

export async function readBountyWithSubmissions(id: bigint): Promise<BountyWithSubmissions> {
  const [bounty, submissions] = await Promise.all([readBounty(id), readSubmissions(id)]);
  return { ...bounty, submissions };
}

export async function readBountiesWithSubmissions(): Promise<BountyWithSubmissions[]> {
  const count = await readBountyCount();
  const ids = Array.from({ length: Number(count) }, (_, index) => BigInt(index));
  return Promise.all(ids.map(readBountyWithSubmissions));
}

const LOG_WINDOW = BigInt(99);
const MAX_LOG_WINDOWS = 300;

export async function findSettlementTxHash(
  bountyId: bigint,
  eventName: "WinnerSelected" | "BountyRefunded",
) {
  const client = getPublicClient(wagmiConfig);
  if (!client) return undefined;

  let toBlock = await client.getBlockNumber();
  for (let window = 0; window < MAX_LOG_WINDOWS && toBlock >= BigInt(0); window++) {
    const fromBlock = toBlock > LOG_WINDOW ? toBlock - LOG_WINDOW : BigInt(0);
    const logs = await client.getContractEvents({
      address: getProofBountyAddress(),
      abi: PROOFBOUNTY_ABI,
      eventName,
      args: { bountyId },
      fromBlock,
      toBlock,
    });
    if (logs.length) return logs[logs.length - 1].transactionHash;
    if (fromBlock === BigInt(0)) break;
    toBlock = fromBlock - BigInt(1);
  }
  return undefined;
}
