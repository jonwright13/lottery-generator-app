import type {
  GenerateValidNumberSetOptions,
  RejectionCounts,
} from "../types";
import {
  countClustersMainNumbers,
  countMaxConsecutiveRun,
  countMultiples,
  isSumInRange,
  maxGapExceedsThreshold,
  maxSameLastDigitCount,
} from "./utils";

export type RejectionReason = keyof RejectionCounts;

export type RuleOptions = Pick<
  GenerateValidNumberSetOptions,
  | "maxMultiplesAllowed"
  | "maxMainGapThreshold"
  | "maxLuckyGapThreshold"
  | "sumMin"
  | "sumMax"
  | "oddRange"
  | "clusterMax"
  | "clusterGroupSize"
  | "maxMain"
  | "maxSameLastDigit"
  | "maxPreviousDrawOverlap"
> & {
  /** Mains of the most recent draw, as numbers; empty when no history. */
  previousDrawMain: number[];
};

export type Rule = (
  nums: number[],
  opts: RuleOptions,
) => RejectionReason | null;

export const mainRules: Rule[] = [
  (nums, { maxMultiplesAllowed }) => {
    for (const [baseStr, maxAllowed] of Object.entries(maxMultiplesAllowed)) {
      const base = parseInt(baseStr, 10);
      if (Number.isNaN(base)) continue;
      if (countMultiples(nums, base) > maxAllowed) return "exceed_multiples";
    }
    return null;
  },
  (nums, { maxMainGapThreshold }) =>
    maxGapExceedsThreshold(nums, maxMainGapThreshold)
      ? "gap_exceeds_threshold"
      : null,
  (nums, { sumMin, sumMax }) =>
    isSumInRange(nums, sumMin, sumMax) ? null : "sum_in_range",
  (nums) => (countMaxConsecutiveRun(nums) >= 3 ? "max_run" : null),
  (nums, { oddRange }) => {
    const oddCount = nums.reduce((acc, n) => acc + (n % 2 === 1 ? 1 : 0), 0);
    return oddCount < oddRange[0] || oddCount > oddRange[1]
      ? "odd_even_balance"
      : null;
  },
  (nums, { clusterMax, maxMain, clusterGroupSize }) => {
    const clusterCounts = countClustersMainNumbers(
      nums,
      maxMain,
      clusterGroupSize,
    );
    return Object.values(clusterCounts).some((c) => c > clusterMax)
      ? "cluster_count"
      : null;
  },
  (nums, { maxSameLastDigit }) =>
    maxSameLastDigitCount(nums) > maxSameLastDigit
      ? "last_digit_repeat"
      : null,
  (nums, { previousDrawMain, maxPreviousDrawOverlap }) => {
    if (!previousDrawMain.length) return null;
    const prev = new Set(previousDrawMain);
    let overlap = 0;
    for (const n of nums) if (prev.has(n)) overlap += 1;
    return overlap > maxPreviousDrawOverlap ? "previous_draw_overlap" : null;
  },
];

export const luckyRules: Rule[] = [
  (nums, { maxLuckyGapThreshold }) =>
    maxGapExceedsThreshold(nums, maxLuckyGapThreshold)
      ? "gap_exceeds_threshold"
      : null,
];

export function evaluateRules(
  rules: Rule[],
  nums: number[],
  opts: RuleOptions,
): RejectionReason | null {
  for (const rule of rules) {
    const reason = rule(nums, opts);
    if (reason) return reason;
  }
  return null;
}
