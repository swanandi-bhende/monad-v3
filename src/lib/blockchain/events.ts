import { decodeEventLog, type Abi, type Address, type Log } from "viem";
import { getBlock, getPublicClient } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { CREDIBILITY_ABI, PROOFBOUNTY_ABI } from "@/lib/contracts/abi";
import { getCredibilityAddress, getProofBountyAddress } from "@/lib/contracts/addresses";
import { env } from "@/lib/config/env";
import type { ChainEvent } from "@/types/event";

const RANGE = 100;
const PARALLEL = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];
const MAX_RANGES_PER_SYNC = 600;
const RECENT_FALLBACK_BLOCKS = RANGE * 20;
const STORAGE_PREFIX = "proofbounty:events:v1:";

type Cache = { lastBlock: number; events: ChainEvent[] };

function cacheKey() {
  return `${STORAGE_PREFIX}${getProofBountyAddress()}:${getCredibilityAddress()}`;
}

function loadCache(key: string): Cache | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

function saveCache(key: string, cache: Cache) {
  try {
    window.localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    // Storage can be full or disabled; the index still works in memory for this session.
  }
}

function decodeLog(log: Log, credibilityAddress: Address) {
  const abi =
    log.address.toLowerCase() === credibilityAddress.toLowerCase()
      ? CREDIBILITY_ABI
      : PROOFBOUNTY_ABI;
  try {
    return decodeEventLog({ abi: abi as Abi, data: log.data, topics: log.topics }) as {
      eventName: string;
      args?: unknown;
    };
  } catch {
    return null;
  }
}

async function withRetry<T>(task: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      const rateLimited = /429|rate limit|too many requests/i.test(String(error));
      if (!rateLimited || attempt >= RETRY_DELAYS_MS.length) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}

function titleFromMetadata(raw: string) {
  try {
    return (JSON.parse(raw) as { title?: string }).title ?? "Untitled bounty";
  } catch {
    return "Untitled bounty";
  }
}

async function fetchRange(from: number, to: number): Promise<Omit<ChainEvent, "timestamp">[]> {
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error("No Monad RPC client is available.");
  const credibilityAddress = getCredibilityAddress();
  const logs = await withRetry(() =>
    client.getLogs({
      address: [getProofBountyAddress(), credibilityAddress],
      fromBlock: BigInt(from),
      toBlock: BigInt(to),
    }),
  );

  const events: Omit<ChainEvent, "timestamp">[] = [];
  for (const log of logs) {
    const decoded = decodeLog(log, credibilityAddress);
    if (!decoded || !log.blockNumber || !log.transactionHash || log.logIndex === null) continue;
    const args = (decoded.args ?? {}) as Record<string, unknown>;
    const base = {
      bountyId: Number(args.bountyId),
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      logIndex: log.logIndex,
    };

    switch (decoded.eventName) {
      case "BountyCreated":
        events.push({
          ...base,
          kind: "created",
          actor: args.creator as Address,
          amount: String(args.reward),
          title: titleFromMetadata(args.metadata as string),
        });
        break;
      case "WorkSubmitted":
        events.push({
          ...base,
          kind: "submitted",
          actor: args.submitter as Address,
          submissionIndex: Number(args.submissionIndex),
        });
        break;
      case "WinnerSelected":
        events.push({
          ...base,
          kind: "winner",
          actor: args.winner as Address,
          submissionIndex: Number(args.submissionIndex),
          amount: String(args.reward),
        });
        break;
      case "BountyRefunded":
        events.push({
          ...base,
          kind: "refunded",
          actor: args.creator as Address,
          amount: String(args.reward),
        });
        break;
      case "SignalMarked":
        events.push({
          ...base,
          kind: "credibility",
          actor: args.voter as Address,
          submissionIndex: Number(args.submissionIndex),
          signal: Number(args.signal) === 1 ? "credible" : "low_quality",
        });
        break;
    }
  }
  return events;
}

async function withTimestamps(events: Omit<ChainEvent, "timestamp">[]): Promise<ChainEvent[]> {
  const blockNumbers = [...new Set(events.map((event) => event.blockNumber))];
  const timestamps = new Map<number, number>();
  await Promise.all(
    blockNumbers.map(async (blockNumber) => {
      const block = await withRetry(() =>
        getBlock(wagmiConfig, { blockNumber: BigInt(blockNumber) }),
      );
      timestamps.set(blockNumber, Number(block.timestamp));
    }),
  );
  return events.map((event) => ({ ...event, timestamp: timestamps.get(event.blockNumber) ?? 0 }));
}

function sortEvents(events: ChainEvent[]) {
  return events.sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
}

export async function syncChainEvents(): Promise<ChainEvent[]> {
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error("No Monad RPC client is available.");

  const head = Number(await client.getBlockNumber());
  const key = cacheKey();
  const cached = loadCache(key);
  const startBlock = env.proofBountyDeployBlock ?? Math.max(0, head - RECENT_FALLBACK_BLOCKS);
  let cache: Cache = cached ?? { lastBlock: startBlock - 1, events: [] };

  let fetchedRanges = 0;
  while (cache.lastBlock < head && fetchedRanges < MAX_RANGES_PER_SYNC) {
    const batch: { from: number; to: number }[] = [];
    for (let i = 0; i < PARALLEL; i++) {
      const from = cache.lastBlock + 1 + i * RANGE;
      if (from > head) break;
      batch.push({ from, to: Math.min(from + RANGE - 1, head) });
    }

    const results = await Promise.all(batch.map((range) => fetchRange(range.from, range.to)));
    const found = results.flat();
    const stamped = found.length ? await withTimestamps(found) : [];
    cache = {
      lastBlock: batch[batch.length - 1].to,
      events: sortEvents([...cache.events, ...stamped]),
    };
    saveCache(key, cache);
    fetchedRanges += batch.length;
  }

  return cache.events;
}
