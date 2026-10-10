import type { RubricCriterion } from "@/types/bounty";

export function averageScore(total: bigint, reviewCount: number) {
  if (reviewCount === 0) return null;
  return Number(total) / reviewCount / 10;
}

export function weightedScore(criteria: RubricCriterion[], marks: number[]) {
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = criteria.reduce(
    (sum, criterion, index) => sum + criterion.weight * (marks[index] ?? 0),
    0,
  );
  return Math.round((weighted / totalWeight) * 10);
}
