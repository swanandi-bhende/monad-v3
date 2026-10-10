import { zeroAddress, type Address } from "viem";
import { readContract, readContracts } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { GIGACHAD_ABI } from "@/lib/contracts/abi";
import { getEscrowAddress } from "@/lib/contracts/addresses";
import type { Bounty, BountyMetadata, BountyStatus, BountyWithSubmissions } from "@/types/bounty";
import type { Submission } from "@/types/submission";

type BountyTuple = readonly [
  Address,
  Address,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  number,
  number,
  number,
  Address,
  string,
];
type SubmissionTuple = readonly { submitter: Address; evidence: string; submittedAt: bigint }[];

const RAW_STATUS_COMPLETED = 1;
const RAW_STATUS_REFUNDED = 2;

function parseMetadata(raw: string): BountyMetadata {
  const fallback: BountyMetadata = {
    title: "Untitled bounty",
    description: "",
    category: "Other",
    selectionMethod: "manual",
    deliverables: "",
    acceptanceCriteria: "",
    submissionInstructions: "",
    tools: [],
    rubric: [],
  };
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<BountyMetadata>) };
  } catch {
    return fallback;
  }
}

function deriveStatus(raw: number, deadline: number, reviewEnd: number, now: number): BountyStatus {
  if (raw === RAW_STATUS_COMPLETED) return "completed";
  if (raw === RAW_STATUS_REFUNDED) return "refunded";
  if (now <= deadline) return "open";
  if (now < reviewEnd) return "under_review";
  return "expired";
}

function toBounty(id: bigint, tuple: BountyTuple): Bounty {
  const [
    creator,
    token,
    reward,
    feeAmount,
    reviewPool,
    reviewPaid,
    winnerAmount,
    deadline,
    reviewEnd,
    reviewSlots,
    reviewCount,
    rawStatus,
    winner,
    metadata,
  ] = tuple;
  const deadlineSeconds = Number(deadline);
  const reviewEndSeconds = Number(reviewEnd);
  const now = Math.floor(Date.now() / 1000);

  return {
    ...parseMetadata(metadata),
    id,
    creator,
    rewardToken: token,
    rewardAmount: reward,
    feeAmount,
    reviewPool,
    reviewPaid,
    winnerAmount,
    deadline: deadlineSeconds,
    reviewEnd: reviewEndSeconds,
    reviewSlots,
    reviewCount,
    status: deriveStatus(rawStatus, deadlineSeconds, reviewEndSeconds, now),
    winner: winner === zeroAddress ? undefined : winner,
  };
}

function toSubmissions(bountyId: bigint, submissions: SubmissionTuple): Submission[] {
  return submissions.map((submission, index) => ({
    bountyId,
    index,
    submitter: submission.submitter,
    evidence: submission.evidence,
    submittedAt: Number(submission.submittedAt),
  }));
}

export function readBountyCount() {
  return readContract(wagmiConfig, {
    address: getEscrowAddress(),
    abi: GIGACHAD_ABI,
    functionName: "bountyCount",
  });
}

export async function readBountyWithSubmissions(id: bigint): Promise<BountyWithSubmissions> {
  const address = getEscrowAddress();
  const [bounty, submissions, scoreTotals] = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: [
      { address, abi: GIGACHAD_ABI, functionName: "bounties", args: [id] },
      { address, abi: GIGACHAD_ABI, functionName: "getSubmissions", args: [id] },
      { address, abi: GIGACHAD_ABI, functionName: "getScoreTotals", args: [id] },
    ],
  });
  return {
    ...toBounty(id, bounty as unknown as BountyTuple),
    submissions: toSubmissions(id, submissions as unknown as SubmissionTuple),
    scoreTotals: scoreTotals as unknown as bigint[],
  };
}

export async function readBountiesWithSubmissions(): Promise<BountyWithSubmissions[]> {
  const count = Number(await readBountyCount());
  if (count === 0) return [];

  const address = getEscrowAddress();
  const ids = Array.from({ length: count }, (_, index) => BigInt(index));
  const [bounties, submissions, scores] = await Promise.all([
    readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: ids.map((id) => ({
        address,
        abi: GIGACHAD_ABI,
        functionName: "bounties" as const,
        args: [id] as const,
      })),
    }),
    readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: ids.map((id) => ({
        address,
        abi: GIGACHAD_ABI,
        functionName: "getSubmissions" as const,
        args: [id] as const,
      })),
    }),
    readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: ids.map((id) => ({
        address,
        abi: GIGACHAD_ABI,
        functionName: "getScoreTotals" as const,
        args: [id] as const,
      })),
    }),
  ]);

  return ids.map((id, index) => ({
    ...toBounty(id, bounties[index] as unknown as BountyTuple),
    submissions: toSubmissions(id, submissions[index] as unknown as SubmissionTuple),
    scoreTotals: scores[index] as unknown as bigint[],
  }));
}
