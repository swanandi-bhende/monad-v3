import { decodeEventLog, type Abi, type Address, type Log } from "viem";
import { getBlock, getPublicClient } from "wagmi/actions";
import { wagmiConfig } from "@/lib/blockchain/wagmi";
import { GIGACHAD_ABI } from "@/lib/contracts/abi";
import { getEscrowAddress } from "@/lib/contracts/addresses";
import { env } from "@/lib/config/env";
import type { ChainEvent } from "@/types/event";

const RANGE = 100;
const PARALLEL = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];
const MAX_RANGES_PER_SYNC = 600;
const RECENT_FALLBACK_BLOCKS = RANGE * 20;
const STORAGE_PREFIX = "gigachad:events:v2:";

type Cache = { lastBlock: number; events: ChainEvent[] };
type Decoded = Omit<ChainEvent, "timestamp">;

function cacheKey() {
  return `${STORAGE_PREFIX}${getEscrowAddress()}`;
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
    // Storage is full or disabled. The index still works for this session.
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

function decodeLog(log: Log) {
  try {
    return decodeEventLog({ abi: GIGACHAD_ABI as Abi, data: log.data, topics: log.topics }) as {
      eventName: string;
      args?: unknown;
    };
  } catch {
    return null;
  }
}

async function fetchRange(from: number, to: number): Promise<Decoded[]> {
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error("No Monad RPC client is available.");
  const logs = await withRetry(() =>
    client.getLogs({
      address: getEscrowAddress(),
      fromBlock: BigInt(from),
      toBlock: BigInt(to),
    }),
  );

  const events: Decoded[] = [];
  for (const log of logs) {
    const decoded = decodeLog(log);
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
      case "WorkReviewed":
        events.push({
          ...base,
          kind: "reviewed",
          actor: args.reviewer as Address,
          amount: String(args.reward),
          reviewNumber: Number(args.reviewNumber),
          feedback: String(args.feedback),
        });
        break;
      case "WinnerSelected":
        events.push({
          ...base,
          kind: "winner",
          actor: args.winner as Address,
          submissionIndex: Number(args.submissionIndex),
          amount: String(args.winnerAmount),
          fee: String(args.feeAmount),
        });
        break;
      case "BountyRefunded":
        events.push({
          ...base,
          kind: "refunded",
          actor: args.creator as Address,
          amount: String(args.amount),
        });
        break;
    }
  }
  return events;
}

async function withTimestamps(events: Decoded[]): Promise<ChainEvent[]> {
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
  const startBlock = env.escrowDeployBlock ?? Math.max(0, head - RECENT_FALLBACK_BLOCKS);
  let cache: Cache = loadCache(key) ?? { lastBlock: startBlock - 1, events: [] };
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
