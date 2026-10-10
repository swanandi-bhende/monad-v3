import { zeroAddress } from "viem";
import { readContract, readContracts } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { PROOFBOUNTY_ABI } from "@/lib/contracts/abi";
import { getProofBountyAddress } from "@/lib/contracts/addresses";
import type { Bounty, BountyMetadata, BountyStatus, BountyWithSubmissions } from "@/types/bounty";
import type { Submission } from "@/types/submission";

type BountyTuple = readonly [
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  number,
  `0x${string}`,
  string,
];
type SubmissionTuple = readonly {
  submitter: `0x${string}`;
  evidence: string;
  submittedAt: bigint;
}[];

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

function toBounty(
  id: bigint,
  [creator, token, reward, deadline, reviewEnd, rawStatus, winner, metadata]: readonly [
    `0x${string}`,
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    number,
    `0x${string}`,
    string,
  ],
): Bounty {
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

function toSubmissions(
  bountyId: bigint,
  submissions: readonly { submitter: `0x${string}`; evidence: string; submittedAt: bigint }[],
): Submission[] {
  return submissions.map((submission, index) => ({
    bountyId,
    index,
    submitter: submission.submitter,
    evidence: submission.evidence,
    submittedAt: Number(submission.submittedAt),
  }));
}

function readBountyCount() {
  return readContract(wagmiConfig, {
    address: getProofBountyAddress(),
    abi: PROOFBOUNTY_ABI,
    functionName: "bountyCount",
  });
}

export async function readBountyWithSubmissions(id: bigint): Promise<BountyWithSubmissions> {
  const address = getProofBountyAddress();
  const [bounty, submissions] = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: [
      { address, abi: PROOFBOUNTY_ABI, functionName: "bounties", args: [id] },
      { address, abi: PROOFBOUNTY_ABI, functionName: "getSubmissions", args: [id] },
    ],
  });
  return {
    ...toBounty(id, bounty),
    submissions: toSubmissions(id, submissions),
  };
}

export async function readBountiesWithSubmissions(): Promise<BountyWithSubmissions[]> {
  const count = Number(await readBountyCount());
  if (count === 0) return [];

  const address = getProofBountyAddress();
  const ids = Array.from({ length: count }, (_, index) => BigInt(index));
  const [bounties, submissions] = await Promise.all([
    readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: ids.map((id) => ({
        address,
        abi: PROOFBOUNTY_ABI,
        functionName: "bounties",
        args: [id],
      })),
    }),
    readContracts(wagmiConfig, {
      allowFailure: false,
      contracts: ids.map((id) => ({
        address,
        abi: PROOFBOUNTY_ABI,
        functionName: "getSubmissions",
        args: [id],
      })),
    }),
  ]);

  return ids.map((id, index) => ({
    ...toBounty(id, bounties[index] as unknown as BountyTuple),
    submissions: toSubmissions(id, submissions[index] as unknown as SubmissionTuple),
  }));
}
