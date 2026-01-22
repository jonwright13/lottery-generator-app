import type {
  GenerateValidNumberSetOptions,
  GenerateValidNumberSetResult,
  LotteryTuple,
} from "@/lib/generator/types";
import {
  countClustersMainNumbers,
  countMaxConsecutiveRun,
  countMultiples,
  generateUniqueNumbers,
  isSumInRange,
  maxGapExceedsThreshold,
} from "./utils";
import { iterationCheckDict } from "./constants";
import { DEFAULT_OPTIONS } from "../constants";

export function generateValidNumberSet(
  lotteryNumbers: LotteryTuple[],
  options: Partial<GenerateValidNumberSetOptions> = {},
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
    debug = DEFAULT_OPTIONS.debug,
  } = options;

  console.log(
    `\nRunning Lottery Number Generator. Max Iterations: ${maxIterations}`,
  );

  // Set of historical combinations for O(1) lookups
  const lotteryNumbersSet = new Set<string>(
    lotteryNumbers.map((draw) => draw.join(",")),
  );

  const totalDraws = lotteryNumbers.length;
  const numPositions = lotteryNumbers[0]?.length ?? 0;

  // Precompute frequency counters per position
  const positionCounters: Array<Record<string, number>> = Array.from(
    { length: numPositions },
    (_, pos) => {
      const counter: Record<string, number> = {};
      for (const draw of lotteryNumbers) {
        const key = draw[pos];
        counter[key] = (counter[key] ?? 0) + 1;
      }
      return counter;
    },
  );

  const triedMainCombinations = new Set<string>();
  const triedLuckyCombinations = new Set<string>();
  const triedCombinedCombinations = new Set<string>();

  let bestScore = 0;
  let bestCombination: LotteryTuple | null = null;
  let bestPatternProb: number[] | null = null;
  let bestIteration = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    // MAIN NUMBERS
    const mainNums = generateUniqueNumbers(
      countMain,
      minMain,
      maxMain,
      triedMainCombinations,
    ); // returns sorted list of numbers

    // Check multiples count per base in main numbers
    let exceedsMultiplesLimit = false;
    for (const [baseStr, maxAllowed] of Object.entries(maxMultiplesAllowed)) {
      const base = parseInt(baseStr, 10);
      if (Number.isNaN(base)) continue;

      if (countMultiples(mainNums, base) > maxAllowed) {
        exceedsMultiplesLimit = true;
        iterationCheckDict.exceed_multiples += 1;
        triedMainCombinations.add(mainNums.join(","));

        if (debug) {
          console.log(
            `Iteration ${iteration}: Too many multiples of ${base} in main numbers. Regenerating...`,
          );
        }
        break;
      }
    }
    if (exceedsMultiplesLimit) continue;

    // Gap between main numbers
    if (maxGapExceedsThreshold(mainNums, maxMainGapThreshold)) {
      iterationCheckDict.gap_exceeds_threshold += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: Gap exceeds max allowed ${maxMainGapThreshold}. Regenerating...`,
        );
      }
      continue;
    }

    // Sum range of main numbers
    if (!isSumInRange(mainNums, sumMin, sumMax)) {
      iterationCheckDict.sum_in_range += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: Sum ${mainNums.reduce(
            (a, b) => a + b,
            0,
          )} outside range (${sumMin}-${sumMax}). Regenerating...`,
        );
      }
      continue;
    }

    // Consecutive runs
    const maxRun = countMaxConsecutiveRun(mainNums);
    if (maxRun >= 3) {
      iterationCheckDict.max_run += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: Main numbers have ${maxRun} consecutive numbers. Regenerating...`,
        );
      }
      continue;
    }

    // Odd/even balance
    const oddCount = mainNums.reduce(
      (acc, num) => acc + (num % 2 === 1 ? 1 : 0),
      0,
    );

    if (oddCount < oddRange[0] || oddCount > oddRange[1]) {
      iterationCheckDict.odd_even_balance += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: Odd count ${oddCount} outside balanced range (${oddRange[0]}–${oddRange[1]}). Regenerating...`,
        );
      }
      continue;
    }

    // Clustering on main numbers
    const clusterCounts = countClustersMainNumbers(mainNums);
    if (Object.values(clusterCounts).some((count) => count > clusterMax)) {
      iterationCheckDict.cluster_count += 1;
      triedMainCombinations.add(mainNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: Main numbers too clustered. Groups: ${JSON.stringify(
            clusterCounts,
          )}. Regenerating...`,
        );
      }
      continue;
    }

    // LUCKY NUMBERS
    const luckyNums = generateUniqueNumbers(
      countLucky,
      minLucky,
      maxLucky,
      triedLuckyCombinations,
    );

    // Gap between lucky numbers
    if (maxGapExceedsThreshold(luckyNums, maxLuckyGapThreshold)) {
      iterationCheckDict.gap_exceeds_threshold += 1;
      triedLuckyCombinations.add(luckyNums.join(","));
      if (debug) {
        console.log(
          `Iteration ${iteration}: lucky_nums gap exceeds max allowed ${maxLuckyGapThreshold}. Regenerating...`,
        );
      }
      continue;
    }

    // COMBINED
    const combinedNums = [...mainNums, ...luckyNums];
    const combinedTupleArr = combinedNums.map((num) =>
      num.toString().padStart(2, "0"),
    );
    const combinedKey = combinedTupleArr.join(",");

    if (triedCombinedCombinations.has(combinedKey)) {
      iterationCheckDict.generation_duplicate += 1;
      if (debug) {
        console.log(
          `Iteration ${iteration}: Generation duplicate found. Regenerating...`,
        );
      }
      continue;
    }

    // Historical duplicate check
    if (lotteryNumbersSet.has(combinedKey)) {
      iterationCheckDict.historical_duplicate += 1;
      triedCombinedCombinations.add(combinedKey);
      if (debug) {
        console.log(`Iteration ${iteration}: Combination exists. Retrying...`);
      }
      continue;
    }

    // Probability score based on historical draws
    const probs: number[] = [];
    for (let index = 0; index < combinedTupleArr.length; index++) {
      const numStr = combinedTupleArr[index];
      const count = positionCounters[index]?.[numStr] ?? 0;
      const prob = totalDraws > 0 ? (count / totalDraws) * 100 : 0;
      probs.push(prob);
    }
    bestPatternProb = probs;
    const avgScore = probs.reduce((a, b) => a + b, 0) / probs.length;

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestCombination = combinedTupleArr as LotteryTuple;
      bestIteration = iteration;
    }

    if (avgScore >= minScore) {
      console.log(
        `Iteration ${iteration}: Valid combination found with score ${avgScore.toFixed(
          2,
        )}%`,
      );
      return {
        bestCombination,
        bestScore,
        bestPatternProb,
        iterations: iteration,
      };
    }
  }

  console.log(
    `Max iterations reached. Best score so far: ${bestScore.toFixed(
      2,
    )}%. Found at iteration ${bestIteration}`,
  );

  return {
    bestCombination,
    bestScore,
    bestPatternProb,
    iterations: maxIterations,
  };
}
