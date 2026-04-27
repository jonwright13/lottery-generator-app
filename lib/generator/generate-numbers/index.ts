import type {
  GenerateValidNumberSetOptions,
  GenerateValidNumberSetResult,
  LotteryTuple,
  RejectionCounts,
} from "../types";
import { generateUniqueNumbers } from "./utils";
import { DEFAULT_OPTIONS } from "../constants";
import {
  evaluateRules,
  luckyRules,
  mainRules,
  type RuleOptions,
} from "./rules";

const emptyRejectionCounts = (): RejectionCounts => ({
  generation_duplicate: 0,
  exceed_multiples: 0,
  max_run: 0,
  cluster_count: 0,
  odd_even_balance: 0,
  gap_exceeds_threshold: 0,
  sum_in_range: 0,
  historical_duplicate: 0,
  last_digit_repeat: 0,
  previous_draw_overlap: 0,
  arithmetic_progression: 0,
});

function buildPositionCounters(
  lotteryNumbers: LotteryTuple[],
): Array<Record<string, number>> {
  const numPositions = lotteryNumbers[0]?.length ?? 0;
  return Array.from({ length: numPositions }, (_, pos) => {
    const counter: Record<string, number> = {};
    for (const draw of lotteryNumbers) {
      const key = draw[pos];
      counter[key] = (counter[key] ?? 0) + 1;
    }
    return counter;
  });
}

function buildPairCounts(
  lotteryNumbers: LotteryTuple[],
  countMain: number,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const draw of lotteryNumbers) {
    const nums = draw
      .slice(0, countMain)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]},${nums[j]}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export function generateValidNumberSet(
  lotteryNumbers: LotteryTuple[],
  options: Partial<GenerateValidNumberSetOptions> = {},
  precomputedPositionCounters?: Array<Record<string, number>>,
  precomputedPairCounts?: Record<string, number>,
): GenerateValidNumberSetResult {
  const {
    minMain = DEFAULT_OPTIONS.minMain,
    maxMain = DEFAULT_OPTIONS.maxMain,
    countMain = DEFAULT_OPTIONS.countMain,
    minLucky = DEFAULT_OPTIONS.minLucky,
    maxLucky = DEFAULT_OPTIONS.maxLucky,
    countLucky = DEFAULT_OPTIONS.countLucky,
    minScore = DEFAULT_OPTIONS.minScore,
    maxIterations = DEFAULT_OPTIONS.maxIterations,
    sumMin = DEFAULT_OPTIONS.sumMin,
    sumMax = DEFAULT_OPTIONS.sumMax,
    maxMainGapThreshold = DEFAULT_OPTIONS.maxMainGapThreshold,
    maxLuckyGapThreshold = DEFAULT_OPTIONS.maxLuckyGapThreshold,
    oddRange = DEFAULT_OPTIONS.oddRange,
    maxMultiplesAllowed = DEFAULT_OPTIONS.maxMultiplesAllowed,
    clusterMax = DEFAULT_OPTIONS.clusterMax,
    clusterGroupSize = DEFAULT_OPTIONS.clusterGroupSize,
    maxSameLastDigit = DEFAULT_OPTIONS.maxSameLastDigit,
    maxPreviousDrawOverlap = DEFAULT_OPTIONS.maxPreviousDrawOverlap,
    pairScoreWeight = DEFAULT_OPTIONS.pairScoreWeight,
    recentWindowSize = DEFAULT_OPTIONS.recentWindowSize,
    recentBias = DEFAULT_OPTIONS.recentBias,
    debug = DEFAULT_OPTIONS.debug,
  } = options;

  const weight = Math.min(1, Math.max(0, pairScoreWeight));
  const recentWeight = Math.min(1, Math.max(0, recentBias));
  const effectiveRecentWindow = Math.max(
    0,
    Math.min(recentWindowSize, lotteryNumbers.length),
  );
  const recentEnabled = recentWeight > 0 && effectiveRecentWindow > 0;
  const recentPositionCounters = recentEnabled
    ? buildPositionCounters(lotteryNumbers.slice(0, effectiveRecentWindow))
    : null;

  if (debug) {
    console.log(
      `\nRunning Lottery Number Generator. Max Iterations: ${maxIterations}`,
    );
  }

  const previousDrawMain: number[] =
    lotteryNumbers[0]?.slice(0, countMain).map((n) => parseInt(n, 10)) ?? [];

  const ruleOpts: RuleOptions = {
    maxMultiplesAllowed,
    maxMainGapThreshold,
    maxLuckyGapThreshold,
    sumMin,
    sumMax,
    oddRange,
    clusterMax,
    clusterGroupSize,
    maxMain,
    maxSameLastDigit,
    maxPreviousDrawOverlap,
    previousDrawMain,
  };

  const rejections = emptyRejectionCounts();

  const lotteryNumbersSet = new Set<string>(
    lotteryNumbers.map((draw) => draw.join(",")),
  );

  const totalDraws = lotteryNumbers.length;
  const positionCounters =
    precomputedPositionCounters ?? buildPositionCounters(lotteryNumbers);
  const pairCounts =
    precomputedPairCounts ?? buildPairCounts(lotteryNumbers, countMain);

  const triedMainCombinations = new Set<string>();
  const triedLuckyCombinations = new Set<string>();
  const triedCombinedCombinations = new Set<string>();

  let bestScore = 0;
  let bestPairScore = 0;
  let bestRecentScore = 0;
  let bestCombinedScore = -1;
  let bestCombination: LotteryTuple | null = null;
  let bestPatternProb: number[] | null = null;
  let bestIteration = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const mainNums = generateUniqueNumbers(
      countMain,
      minMain,
      maxMain,
      triedMainCombinations,
    );

    const mainReason = evaluateRules(mainRules, mainNums, ruleOpts);
    if (mainReason) {
      rejections[mainReason] += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(`Iteration ${iteration}: main rejected — ${mainReason}`);
      }
      continue;
    }

    const luckyNums = generateUniqueNumbers(
      countLucky,
      minLucky,
      maxLucky,
      triedLuckyCombinations,
    );

    const luckyReason = evaluateRules(luckyRules, luckyNums, ruleOpts);
    if (luckyReason) {
      rejections[luckyReason] += 1;
      triedLuckyCombinations.add(luckyNums.join(","));
      if (debug) {
        console.log(`Iteration ${iteration}: lucky rejected — ${luckyReason}`);
      }
      continue;
    }

    const combinedNums = [...mainNums, ...luckyNums];
    const combinedTupleArr = combinedNums.map((num) =>
      num.toString().padStart(2, "0"),
    );
    const combinedKey = combinedTupleArr.join(",");

    if (triedCombinedCombinations.has(combinedKey)) {
      rejections.generation_duplicate += 1;
      if (debug) {
        console.log(`Iteration ${iteration}: generation duplicate`);
      }
      continue;
    }

    if (lotteryNumbersSet.has(combinedKey)) {
      rejections.historical_duplicate += 1;
      triedCombinedCombinations.add(combinedKey);
      if (debug) {
        console.log(`Iteration ${iteration}: historical duplicate`);
      }
      continue;
    }

    triedCombinedCombinations.add(combinedKey);

    const probs: number[] = [];
    for (let index = 0; index < combinedTupleArr.length; index++) {
      const numStr = combinedTupleArr[index];
      const count = positionCounters[index]?.[numStr] ?? 0;
      const prob = totalDraws > 0 ? (count / totalDraws) * 100 : 0;
      probs.push(prob);
    }
    const avgScore = probs.reduce((a, b) => a + b, 0) / probs.length;

    let recentScore = 0;
    if (recentEnabled && recentPositionCounters) {
      let recentSum = 0;
      for (let index = 0; index < combinedTupleArr.length; index++) {
        const numStr = combinedTupleArr[index];
        const count = recentPositionCounters[index]?.[numStr] ?? 0;
        recentSum += (count / effectiveRecentWindow) * 100;
      }
      recentScore = recentSum / combinedTupleArr.length;
    }

    const positionBlended = recentEnabled
      ? (1 - recentWeight) * avgScore + recentWeight * recentScore
      : avgScore;

    let pairScore = 0;
    if (totalDraws > 0) {
      const sortedMain = [...mainNums].sort((a, b) => a - b);
      let pairSum = 0;
      let pairN = 0;
      for (let i = 0; i < sortedMain.length; i++) {
        for (let j = i + 1; j < sortedMain.length; j++) {
          const key = `${sortedMain[i]},${sortedMain[j]}`;
          pairSum += pairCounts[key] ?? 0;
          pairN += 1;
        }
      }
      pairScore = pairN > 0 ? ((pairSum / pairN) / totalDraws) * 100 : 0;
    }

    const combinedScore = (1 - weight) * positionBlended + weight * pairScore;

    if (combinedScore > bestCombinedScore) {
      bestCombinedScore = combinedScore;
      bestScore = avgScore;
      bestPairScore = pairScore;
      bestRecentScore = recentScore;
      bestCombination = combinedTupleArr as LotteryTuple;
      bestPatternProb = probs;
      bestIteration = iteration;
    }

    if (combinedScore >= minScore) {
      if (debug) {
        console.log(
          `Iteration ${iteration}: valid combination found, position ${avgScore.toFixed(
            2,
          )}% recent ${recentScore.toFixed(2)}% pair ${pairScore.toFixed(2)}% combined ${combinedScore.toFixed(2)}%`,
        );
      }
      return {
        bestCombination,
        bestScore,
        bestPairScore,
        bestRecentScore,
        bestPatternProb,
        iterations: iteration,
        rejections,
      };
    }
  }

  if (debug) {
    console.log(
      `Max iterations reached. Best score so far: ${bestScore.toFixed(
        2,
      )}%. Found at iteration ${bestIteration}`,
    );
  }

  return {
    bestCombination,
    bestScore,
    bestPairScore,
    bestRecentScore,
    bestPatternProb,
    iterations: maxIterations,
    rejections,
  };
}
