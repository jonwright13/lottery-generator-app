import {
  evaluateRules,
  luckyRules,
  mainRules,
  type RuleOptions,
} from "./generate-numbers/rules";
import type { GenerateValidNumberSetOptions, LotteryTuple } from "./types";

export interface QualifyingDrawsCount {
  /** Number of historical draws that pass every constraint at the given options. */
  pass: number;
  /** Total draws inspected. */
  total: number;
}

type Options = Pick<
  GenerateValidNumberSetOptions,
  | "countMain"
  | "maxMain"
  | "sumMin"
  | "sumMax"
  | "oddRange"
  | "maxMainGapThreshold"
  | "maxLuckyGapThreshold"
  | "maxMultiplesAllowed"
  | "clusterMax"
  | "clusterGroupSize"
  | "maxSameLastDigit"
  | "maxPreviousDrawOverlap"
>;

/**
 * Count how many historical draws would pass the current constraint set.
 * Reuses the same `evaluateRules` chain the generator runs at random-candidate
 * time, so the answer is exactly "how many of these real draws would the
 * generator have considered acceptable" — which is the most direct sanity
 * check on whether the user has tightened the controls past usefulness.
 *
 * `pastNumbers` is expected newest-first (matches the data fetcher convention),
 * so `pastNumbers[i+1]` is the chronologically-previous draw to `pastNumbers[i]`
 * — exactly what the previous-draw-overlap rule wants.
 */
export function countQualifyingDraws(
  pastNumbers: LotteryTuple[],
  options: Options,
): QualifyingDrawsCount {
  const total = pastNumbers.length;
  if (total === 0) return { pass: 0, total: 0 };

  const mainCount = options.countMain;

  let pass = 0;
  for (let i = 0; i < total; i++) {
    const draw = pastNumbers[i];
    // Several rules (maxGapExceedsThreshold, etc.) assume sorted input — the
    // generator gets that for free from generateUniqueNumbers, but the
    // historical tuples can vary by data source, so sort defensively here.
    const mains: number[] = new Array(mainCount);
    for (let p = 0; p < mainCount; p++) mains[p] = parseInt(draw[p], 10);
    mains.sort((a, b) => a - b);

    const luckyLen = draw.length - mainCount;
    const lucky: number[] = new Array(luckyLen);
    for (let p = 0; p < luckyLen; p++)
      lucky[p] = parseInt(draw[mainCount + p], 10);
    lucky.sort((a, b) => a - b);

    const prev = pastNumbers[i + 1];
    const previousDrawMain: number[] = prev
      ? prev.slice(0, mainCount).map((n) => parseInt(n, 10))
      : [];

    const ruleOpts: RuleOptions = {
      maxMultiplesAllowed: options.maxMultiplesAllowed,
      maxMainGapThreshold: options.maxMainGapThreshold,
      maxLuckyGapThreshold: options.maxLuckyGapThreshold,
      sumMin: options.sumMin,
      sumMax: options.sumMax,
      oddRange: options.oddRange,
      clusterMax: options.clusterMax,
      clusterGroupSize: options.clusterGroupSize,
      maxMain: options.maxMain,
      maxSameLastDigit: options.maxSameLastDigit,
      maxPreviousDrawOverlap: options.maxPreviousDrawOverlap,
      previousDrawMain,
    };

    if (evaluateRules(mainRules, mains, ruleOpts)) continue;
    if (evaluateRules(luckyRules, lucky, ruleOpts)) continue;
    pass += 1;
  }

  return { pass, total };
}
