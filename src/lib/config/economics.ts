export const REVIEWER_BPS = 1_000;
export const BPS = 10_000;

export function feeBps(reward: bigint) {
  if (reward < BigInt(50_000_000)) return 500;
  if (reward <= BigInt(500_000_000)) return 400;
  return 300;
}

export function computeSplit(reward: bigint) {
  const fee = (reward * BigInt(feeBps(reward))) / BigInt(BPS);
  const reviewPool = (reward * BigInt(REVIEWER_BPS)) / BigInt(BPS);
  const winner = reward - fee - reviewPool;
  return { reward, fee, feeBps: feeBps(reward), reviewPool, winner };
}

export function reviewerRewardPerSlot(reviewPool: bigint, slots: number) {
  return reviewPool / BigInt(slots);
}
