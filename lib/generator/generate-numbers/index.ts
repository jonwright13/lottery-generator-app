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

export function generateValidNumberSet(
  lotteryNumbers: LotteryTuple[],
  options: Partial<GenerateValidNumberSetOptions> = {},
  precomputedPositionCounters?: Array<Record<string, number>>,
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
    debug = DEFAULT_OPTIONS.debug,
  } = options;

  if (debug) {
    console.log(
      `\nRunning Lottery Number Generator. Max Iterations: ${maxIterations}`,
    );
  }

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
  };

  const rejections = emptyRejectionCounts();

  const lotteryNumbersSet = new Set<string>(
    lotteryNumbers.map((draw) => draw.join(",")),
  );

  const totalDraws = lotteryNumbers.length;
  const positionCounters =
    precomputedPositionCounters ?? buildPositionCounters(lotteryNumbers);

  const triedMainCombinations = new Set<string>();
  const triedLuckyCombinations = new Set<string>();
  const triedCombinedCombinations = new Set<string>();

  let bestScore = 0;
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

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestCombination = combinedTupleArr as LotteryTuple;
      bestPatternProb = probs;
      bestIteration = iteration;
    }

    if (avgScore >= minScore) {
      if (debug) {
        console.log(
          `Iteration ${iteration}: valid combination found, score ${avgScore.toFixed(
            2,
          )}%`,
        );
      }
      return {
        bestCombination,
        bestScore,
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
    bestPatternProb,
    iterations: maxIterations,
    rejections,
  };
}
