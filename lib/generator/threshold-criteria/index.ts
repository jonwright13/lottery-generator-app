// import this from wherever you put it
import {
  type DistributionAnalysis,
  type HeatCell,
  type LotteryTuple,
  type OddRange,
} from "../types";
import type { GameConfig } from "@/lib/games";
import { generatePatternProbabilities } from "../generate-pattern-probs";
import { percentile } from "./utils";

interface GapDistribution {
  main: { gapCounters: Array<Record<number, number>> };
  lucky: { gapCounters: Array<Record<number, number>> };
}

interface MultiplesDistributionResult {
  distribution: Record<number, number>;
  exampleDraws: LotteryTuple[];
  maxAllowed: number;
}

interface LastDigitDistribution {
  /** Total occurrences of each last digit (0..9) across mains, summed over all draws. */
  perDigitTotals: Record<number, number>;
  /** Distribution of "largest same-last-digit count within a single draw". */
  maxRepeatDistribution: Record<number, number>;
}

interface PreviousDrawOverlap {
  /** Distribution of "main-number overlap with the immediately prior draw" (0..mainCount). */
  overlapDistribution: Record<number, number>;
  /** Number of consecutive-draw pairs analysed (i.e. lotteryNumbers.length - 1). */
  pairsAnalysed: number;
}

interface ConsecutiveRunDistribution {
  /** Map from longest consecutive-run length within a draw → number of draws with that as their longest run. Length 1 = no consecutive numbers at all. */
  byLength: Record<number, number>;
  /** Total historical draws inspected. */
  drawsAnalysed: number;
}

interface ArithmeticProgressionAnalysis {
  /** Number of historical draws whose main numbers contain an AP-3 with d ≥ 2. */
  drawsWithAp3: number;
  /** Total historical draws inspected. */
  drawsAnalysed: number;
  /** Per common-difference d (2..max), how many draws contain at least one AP-3 with that d. */
  drawsByDiff: Record<number, number>;
}

interface PairCoOccurrenceAnalysis {
  /** Map keyed "a,b" with a<b of how many historical draws contain both a and b in main. */
  pairCounts: Record<string, number>;
  /** Mean pair co-occurrence count across the C(mainMax, 2) pairs that actually appear in history. */
  meanPairCount: number;
  /** Total historical draws inspected. */
  drawsAnalysed: number;
  /** Range of values used to mainOnly-slice each tuple. */
  mainCount: number;
  /** Highest main number considered (= GameConfig.main.max). */
  maxMain: number;
}

interface TripletCoOccurrenceAnalysis {
  /** Map keyed "a,b,c" with a<b<c of how many historical draws contain all three in main. */
  tripletCounts: Record<string, number>;
  /** Mean triplet count across the C(mainMax, 3) triplets that actually appear in history. */
  meanTripletCount: number;
  /** Total historical draws inspected. */
  drawsAnalysed: number;
  /** Range of values used to mainOnly-slice each tuple. */
  mainCount: number;
  /** Highest main number considered (= GameConfig.main.max). */
  maxMain: number;
}

export class ThresholdCriteria {
  readonly game: GameConfig;
  maxPatternProbs: Record<string, number>;
  oddRange: OddRange;
  sumMin: number;
  sumMax: number;
  maxMainGapThreshold: number;
  maxLuckyGapThreshold: number;
  maxMultiplesAllowed: Record<number, number>;
  distribution: DistributionAnalysis[];
  gapDistributionData: GapDistribution;
  positionCounters: Array<Record<string, number>>;
  lastDigitDistributionData: LastDigitDistribution;
  maxSameLastDigit: number;
  previousDrawOverlapData: PreviousDrawOverlap;
  maxPreviousDrawOverlap: number;
  arithmeticProgressionData: ArithmeticProgressionAnalysis;
  consecutiveRunData: ConsecutiveRunDistribution;
  pairCoOccurrenceData: PairCoOccurrenceAnalysis;
  tripletCoOccurrenceData: TripletCoOccurrenceAnalysis;

  constructor(
    lotteryNumbers: LotteryTuple[],
    game: GameConfig,
    debug = false,
  ) {
    this.game = game;
    const mainCount = game.main.count;
    const bonusCount = game.bonus.count;
    const mainMax = game.main.max;

    this.maxPatternProbs = this.getMaxPatternProbabilities(
      lotteryNumbers,
      debug,
    );

    const [distributionAnalysis, oddRange] = this.analyzeOddEvenDistribution(
      lotteryNumbers,
      mainCount,
      debug,
    );
    this.distribution = distributionAnalysis;
    this.oddRange = oddRange;

    const [sumMin, sumMax] = this.analyzeSumRange(
      lotteryNumbers,
      mainCount,
      15,
      85,
      debug,
    );
    this.sumMin = sumMin;
    this.sumMax = sumMax;

    const { gapData, range } = this.determineGapThresholds(
      lotteryNumbers,
      mainCount,
      bonusCount,
      95,
    );
    this.gapDistributionData = gapData;
    this.maxMainGapThreshold = range[0];
    this.maxLuckyGapThreshold = range[1];

    this.maxMultiplesAllowed = this.generateMaxMultiplesAllowed(
      lotteryNumbers,
      mainCount,
      Array.from({ length: 9 }, (_, i) => i + 2), // 2..10
      debug,
    );

    this.positionCounters = this.getPositionCounters(lotteryNumbers);

    const { distribution: lastDigitDist, maxAllowed: lastDigitMax } =
      this.analyzeLastDigitDistribution(lotteryNumbers, mainCount, 95);
    this.lastDigitDistributionData = lastDigitDist;
    this.maxSameLastDigit = lastDigitMax;

    const { distribution: overlapDist, maxAllowed: overlapMax } =
      this.analyzePreviousDrawOverlap(lotteryNumbers, mainCount, 95);
    this.previousDrawOverlapData = overlapDist;
    this.maxPreviousDrawOverlap = overlapMax;

    this.arithmeticProgressionData =
      this.analyzeArithmeticProgressionDistribution(lotteryNumbers, mainCount);

    this.consecutiveRunData = this.analyzeConsecutiveRunDistribution(
      lotteryNumbers,
      mainCount,
    );

    this.pairCoOccurrenceData = this.analyzePairCoOccurrence(
      lotteryNumbers,
      mainCount,
      mainMax,
    );

    this.tripletCoOccurrenceData = this.analyzeTripletCoOccurrence(
      lotteryNumbers,
      mainCount,
      mainMax,
    );
  }

  analyzeTripletCoOccurrence(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    maxMain: number,
  ): TripletCoOccurrenceAnalysis {
    const tripletCounts: Record<string, number> = {};

    for (const draw of lotteryNumbers) {
      const nums = draw
        .slice(0, mainCount)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            const key = `${nums[i]},${nums[j]},${nums[k]}`;
            tripletCounts[key] = (tripletCounts[key] ?? 0) + 1;
          }
        }
      }
    }

    // Mean is computed over the full C(maxMain, 3) space — including triplets
    // that have never been drawn — so the "is this triplet hot?" comparison
    // reflects its standing across all *possible* triplets, not just observed
    // ones. With ~3000 draws this typically yields a value < 2, so the
    // signal-to-noise here is poor and the score is best treated as a soft
    // tie-breaker. See ADR / future-ideas notes.
    const totalPossibleTriplets =
      maxMain >= 3 ? (maxMain * (maxMain - 1) * (maxMain - 2)) / 6 : 0;
    let sum = 0;
    for (const v of Object.values(tripletCounts)) sum += v;
    const meanTripletCount =
      totalPossibleTriplets > 0 ? sum / totalPossibleTriplets : 0;

    return {
      tripletCounts,
      meanTripletCount,
      drawsAnalysed: lotteryNumbers.length,
      mainCount,
      maxMain,
    };
  }

  analyzePairCoOccurrence(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    maxMain: number,
  ): PairCoOccurrenceAnalysis {
    const pairCounts: Record<string, number> = {};

    for (const draw of lotteryNumbers) {
      const nums = draw
        .slice(0, mainCount)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]},${nums[j]}`;
          pairCounts[key] = (pairCounts[key] ?? 0) + 1;
        }
      }
    }

    const totalPossiblePairs = (maxMain * (maxMain - 1)) / 2;
    let sum = 0;
    for (const v of Object.values(pairCounts)) sum += v;
    const meanPairCount = totalPossiblePairs > 0 ? sum / totalPossiblePairs : 0;

    return {
      pairCounts,
      meanPairCount,
      drawsAnalysed: lotteryNumbers.length,
      mainCount,
      maxMain,
    };
  }

  analyzeConsecutiveRunDistribution(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
  ): ConsecutiveRunDistribution {
    const byLength: Record<number, number> = {};
    for (const draw of lotteryNumbers) {
      const nums = draw
        .slice(0, mainCount)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);
      let maxRun = 1;
      let currentRun = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i - 1] + 1) {
          currentRun += 1;
          if (currentRun > maxRun) maxRun = currentRun;
        } else if (nums[i] !== nums[i - 1]) {
          currentRun = 1;
        }
      }
      byLength[maxRun] = (byLength[maxRun] ?? 0) + 1;
    }
    return { byLength, drawsAnalysed: lotteryNumbers.length };
  }

  analyzeArithmeticProgressionDistribution(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
  ): ArithmeticProgressionAnalysis {
    const drawsByDiff: Record<number, number> = {};
    let drawsWithAp3 = 0;

    for (const draw of lotteryNumbers) {
      const nums = draw
        .slice(0, mainCount)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);
      const set = new Set(nums);
      const seenDiffs = new Set<number>();
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const d = nums[j] - nums[i];
          if (d < 2) continue;
          if (set.has(nums[i] + 2 * d)) seenDiffs.add(d);
        }
      }
      if (seenDiffs.size > 0) {
        drawsWithAp3 += 1;
        for (const d of seenDiffs) {
          drawsByDiff[d] = (drawsByDiff[d] ?? 0) + 1;
        }
      }
    }

    return {
      drawsWithAp3,
      drawsAnalysed: lotteryNumbers.length,
      drawsByDiff,
    };
  }

  analyzePreviousDrawOverlap(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    percentileValue = 95,
  ): { distribution: PreviousDrawOverlap; maxAllowed: number } {
    const overlapDistribution: Record<number, number> = {};
    const overlaps: number[] = [];

    for (let i = 0; i < lotteryNumbers.length - 1; i++) {
      const a = new Set(lotteryNumbers[i].slice(0, mainCount));
      const b = lotteryNumbers[i + 1].slice(0, mainCount);
      let overlap = 0;
      for (const n of b) if (a.has(n)) overlap += 1;
      overlaps.push(overlap);
      overlapDistribution[overlap] = (overlapDistribution[overlap] ?? 0) + 1;
    }

    for (let k = 0; k <= mainCount; k++) {
      if (!(k in overlapDistribution)) overlapDistribution[k] = 0;
    }

    const maxAllowed = overlaps.length
      ? Math.floor(percentile(overlaps, percentileValue))
      : mainCount;

    return {
      distribution: {
        overlapDistribution,
        pairsAnalysed: overlaps.length,
      },
      maxAllowed: Math.max(0, maxAllowed),
    };
  }

  analyzeLastDigitDistribution(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    percentileValue = 95,
  ): { distribution: LastDigitDistribution; maxAllowed: number } {
    const perDigitTotals: Record<number, number> = {};
    for (let d = 0; d <= 9; d++) perDigitTotals[d] = 0;
    const maxRepeatDistribution: Record<number, number> = {};
    const maxRepeats: number[] = [];

    for (const draw of lotteryNumbers) {
      const perDraw: Record<number, number> = {};
      for (let i = 0; i < mainCount; i++) {
        const lastDigit = parseInt(draw[i], 10) % 10;
        perDraw[lastDigit] = (perDraw[lastDigit] ?? 0) + 1;
        perDigitTotals[lastDigit] += 1;
      }
      const maxRepeat = Math.max(...Object.values(perDraw));
      maxRepeats.push(maxRepeat);
      maxRepeatDistribution[maxRepeat] =
        (maxRepeatDistribution[maxRepeat] ?? 0) + 1;
    }

    const maxAllowed = maxRepeats.length
      ? Math.floor(percentile(maxRepeats, percentileValue))
      : mainCount;

    return {
      distribution: { perDigitTotals, maxRepeatDistribution },
      maxAllowed: Math.max(1, maxAllowed),
    };
  }

  private getPositionCounters(
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

  public toHeatmapCells(min: number, max: number): HeatCell[] {
    const cells: HeatCell[] = [];

    for (let pos = 0; pos < this.positionCounters.length; pos++) {
      const counter = this.positionCounters[pos];

      // total draws for this position
      let total = 0;
      for (let num = min; num <= max; num++) {
        const key = String(num).padStart(2, "0");
        total += counter[key] ?? 0;
      }

      // build cells with pct
      for (let num = min; num <= max; num++) {
        const key = String(num).padStart(2, "0");
        const count = counter[key] ?? 0;

        cells.push({
          pos,
          num,
          count,
          pct: total > 0 ? count / total : 0,
        });
      }
    }

    return cells;
  }

  private getMaxPatternProbabilities(
    lotteryNumbers: LotteryTuple[],
    debug = true,
  ): Record<string, number> {
    const numPositions = lotteryNumbers[0]?.length ?? 0;

    // Position counters: one per index, counting occurrences of each value
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

    const totalDraws = lotteryNumbers.length;
    const nums = this.getTopNumbersHistorical(lotteryNumbers);

    const probs: number[] = [];
    nums.forEach((numStr, index) => {
      const count = positionCounters[index][numStr] ?? 0;
      const prob = totalDraws > 0 ? (count / totalDraws) * 100 : 0;
      probs.push(prob);
    });

    const patternProb = generatePatternProbabilities(
      probs,
      this.game.main.count,
      this.game.bonus.count,
    );

    if (debug) {
      console.log("\nMax Pattern Probabilities Possible");
      for (const [k, v] of Object.entries(patternProb)) {
        console.log(`${k.padEnd(30)}: ${v.toFixed(2)}%`);
      }
    }

    return patternProb;
  }

  private getTopNumbersHistorical(
    lotteryNumbers: LotteryTuple[],
  ): LotteryTuple {
    const expected = this.game.main.count + this.game.bonus.count;
    const topNumbers: string[] = [];

    for (let index = 0; index < lotteryNumbers[0].length; index++) {
      const counter: Record<string, number> = {};
      for (const draw of lotteryNumbers) {
        const key = draw[index];
        counter[key] = (counter[key] ?? 0) + 1;
      }

      const mostCommonKey = Object.entries(counter).sort(
        (a, b) => b[1] - a[1],
      )[0][0];
      topNumbers.push(mostCommonKey);
    }

    if (topNumbers.length !== expected) {
      throw new Error(
        `Expected ${expected}-position lottery tuple for game "${this.game.id}", got ${topNumbers.length}`,
      );
    }

    return topNumbers;
  }

  analyzeOddEvenDistribution(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    debug = false,
  ): [DistributionAnalysis[], OddRange] {
    const distribution: Record<number, number> = {};
    const distributionAnalysis: DistributionAnalysis[] = [];

    for (const draw of lotteryNumbers) {
      const numbers = draw.slice(0, mainCount).map((n) => parseInt(n, 10));
      const oddCount = numbers.reduce(
        (acc, num) => acc + (num % 2 === 1 ? 1 : 0),
        0,
      );
      distribution[oddCount] = (distribution[oddCount] ?? 0) + 1;
    }

    const totalDraws = lotteryNumbers.length;

    for (let oddCount = 0; oddCount <= mainCount; oddCount++) {
      const count = distribution[oddCount] ?? 0;
      const pct = totalDraws ? (count / totalDraws) * 100 : 0;
      const evenCount = mainCount - oddCount;
      distributionAnalysis.push({
        label: `${oddCount} odd / ${evenCount} even`,
        oddCount,
        count,
        pct,
      });

      if (debug) {
        console.log(
          `Total draws analyzed: ${totalDraws}\nOdd/Even distribution (odd numbers count in main numbers):`,
        );

        console.log(
          `  ${oddCount} odd / ${evenCount} even : ${count} draws (${pct.toFixed(
            2,
          )}%)`,
        );
      }
    }

    const oddCountsWithData = Object.entries(distribution)
      .filter(([, v]) => v > 0)
      .map(([k]) => parseInt(k, 10))
      .sort((a, b) => a - b);

    const lowThreshold =
      oddCountsWithData.length > 0 ? oddCountsWithData[0] : 0;
    const highThreshold =
      oddCountsWithData.length > 0
        ? oddCountsWithData[oddCountsWithData.length - 1]
        : 0;

    return [distributionAnalysis, [lowThreshold, highThreshold]];
  }

  analyzeSumRange(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    lowerPercentile = 15,
    upperPercentile = 85,
    debug = false,
  ): [number, number] {
    const sums: number[] = lotteryNumbers.map((draw) =>
      draw
        .slice(0, mainCount)
        .map((n) => parseInt(n, 10))
        .reduce((acc, n) => acc + n, 0),
    );

    const minSum = Math.min(...sums);
    const maxSum = Math.max(...sums);
    const meanSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const sorted = [...sums].sort((a, b) => a - b);
    const medianSum =
      sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    const lowPct = percentile(sums, lowerPercentile);
    const highPct = percentile(sums, upperPercentile);

    if (debug) {
      console.log(`\nTotal draws analyzed: ${sums.length}`);
      console.log(`Sum range: min=${minSum}, max=${maxSum}`);
      console.log(`Mean sum: ${meanSum.toFixed(2)}, Median sum: ${medianSum}`);
      console.log(`${lowerPercentile}th percentile sum: ${lowPct}`);
      console.log(`${upperPercentile}th percentile sum: ${highPct}`);
      console.log(
        `Typical sum range (between ${lowerPercentile}th and ${upperPercentile}th percentiles): ${lowPct} - ${highPct}`,
      );
    }

    return [Math.floor(lowPct), Math.floor(highPct)];
  }

  determineGapThresholds(
    lotteryNumbers: LotteryTuple[],
    countMain: number,
    countLucky: number,
    percentileValue = 95,
  ): { gapData: GapDistribution; range: [number, number] } {
    const gapData = this.analyzeGapDistribution(
      lotteryNumbers,
      countMain,
      countLucky,
    );

    const expandGaps = (counters: Array<Record<number, number>>): number[] => {
      const gapsList: number[] = [];
      for (const counter of counters) {
        for (const [gapSizeStr, count] of Object.entries(counter)) {
          const gapSize = parseInt(gapSizeStr, 10);
          for (let i = 0; i < count; i++) {
            gapsList.push(gapSize);
          }
        }
      }
      return gapsList;
    };

    const mainGaps = gapData.main.gapCounters.length
      ? expandGaps(gapData.main.gapCounters)
      : [];
    const luckyGaps = gapData.lucky.gapCounters.length
      ? expandGaps(gapData.lucky.gapCounters)
      : [];

    let maxMainGap: number;
    if (!mainGaps.length) {
      maxMainGap = 19;
    } else {
      maxMainGap = Math.floor(percentile(mainGaps, percentileValue));
    }

    let maxLuckyGap: number;
    if (!luckyGaps.length) {
      maxLuckyGap = 5;
    } else {
      maxLuckyGap = Math.floor(percentile(luckyGaps, percentileValue));
    }

    return { gapData, range: [maxMainGap, maxLuckyGap] };
  }

  analyzeGapDistribution(
    lotteryNumbers: LotteryTuple[],
    countMain: number,
    countLucky: number,
  ): GapDistribution {
    const mainGapCounters: Array<Record<number, number>> = Array.from(
      { length: Math.max(0, countMain - 1) },
      () => ({}),
    );
    const luckyGapCounters: Array<Record<number, number>> =
      countLucky > 1 ? Array.from({ length: countLucky - 1 }, () => ({})) : [];

    for (const draw of lotteryNumbers) {
      const mainNums = draw
        .slice(0, countMain)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);

      const luckyNums = draw
        .slice(countMain, countMain + countLucky)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);

      for (let i = 0; i < mainNums.length - 1; i++) {
        const gap = mainNums[i + 1] - mainNums[i];
        mainGapCounters[i][gap] = (mainGapCounters[i][gap] ?? 0) + 1;
      }

      for (let i = 0; i < luckyNums.length - 1; i++) {
        const gap = luckyNums[i + 1] - luckyNums[i];
        luckyGapCounters[i][gap] = (luckyGapCounters[i][gap] ?? 0) + 1;
      }
    }

    return {
      main: { gapCounters: mainGapCounters },
      lucky: { gapCounters: luckyGapCounters },
    };
  }

  generateMaxMultiplesAllowed(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    bases: number[] = Array.from({ length: 9 }, (_, i) => i + 2), // 2..10
    debug = false,
  ): Record<number, number> {
    const maxMultiplesDict: Record<number, number> = {};

    for (const base of bases) {
      const { maxAllowed } = this.analyzeMultiplesDistribution(
        lotteryNumbers,
        mainCount,
        base,
        debug,
      );
      maxMultiplesDict[base] = maxAllowed;
    }

    if (debug) {
      console.log("\nFinal maxMultiplesAllowed dict:");
      for (const [baseStr, maxCount] of Object.entries(maxMultiplesDict)) {
        console.log(`  ${baseStr}: ${maxCount}`);
      }
    }

    return maxMultiplesDict;
  }

  analyzeMultiplesDistribution(
    lotteryNumbers: LotteryTuple[],
    mainCount: number,
    base = 3,
    debug = false,
  ): MultiplesDistributionResult {
    const distribution: Record<number, number> = {};
    const exampleDraws: LotteryTuple[] = [];

    const multiplesCounts: number[] = [];

    for (const draw of lotteryNumbers) {
      const numbers = draw.slice(0, mainCount).map((n) => parseInt(n, 10));

      const countMultiples = numbers.reduce(
        (acc, num) => acc + (num % base === 0 ? 1 : 0),
        0,
      );

      multiplesCounts.push(countMultiples);
      distribution[countMultiples] = (distribution[countMultiples] ?? 0) + 1;

      if (countMultiples >= 3) {
        exampleDraws.push(draw);
      }
    }

    const totalDraws = lotteryNumbers.length;

    if (debug) {
      console.log(
        `\nAnalyzing multiples of ${base} in main numbers:\n`,
      );
    }

    const sortedKeys = Object.keys(distribution)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    for (const count of sortedKeys) {
      const pct = (distribution[count] / totalDraws) * 100;
      if (debug) {
        console.log(
          `  Draws with exactly ${count} multiples of ${base}: ${
            distribution[count]
          } (${pct.toFixed(2)}%) of all draws`,
        );
      }
    }

    const maxAllowed = Math.floor(percentile(multiplesCounts, 95));

    if (debug) {
      console.log(
        `\nSuggested max multiples allowed for base ${base} (95th percentile): ${maxAllowed}\n`,
      );
    }

    return { distribution, exampleDraws, maxAllowed };
  }
}
