// import this from wherever you put it
import { LotteryTuple } from "@/types";
import { generatePatternProbabilities } from "./generate-pattern-probs";

export type OddRange = [number, number];

interface GapDistribution {
  main: { gapCounters: Array<Record<number, number>> };
  lucky: { gapCounters: Array<Record<number, number>> };
}

interface MultiplesDistributionResult {
  distribution: Record<number, number>;
  exampleDraws: LotteryTuple[];
  maxAllowed: number;
}

// Simple percentile helper to mimic numpy.percentile
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) return sorted[lower];

  const weight = rank - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}

export interface DistributionAnalysis {
  label: string;
  oddCount: number;
  count: number;
  pct: number;
}

export interface HeatCell {
  pos: number;
  num: number;
  count: number;
  pct: number;
}

export class ThresholdCriteria {
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

  constructor(lotteryNumbers: LotteryTuple[], debug = false) {
    this.maxPatternProbs = this.getMaxPatternProbabilities(
      lotteryNumbers,
      debug,
    );

    const [distributionAnalysis, oddRange] = this.analyzeOddEvenDistribution(
      lotteryNumbers,
      true,
      debug,
    );
    this.distribution = distributionAnalysis;
    this.oddRange = oddRange;

    const [sumMin, sumMax] = this.analyzeSumRange(
      lotteryNumbers,
      5,
      15,
      85,
      debug,
    );
    this.sumMin = sumMin;
    this.sumMax = sumMax;

    const { gapData, range } = this.determineGapThresholds(
      lotteryNumbers,
      5,
      2,
      95,
    );
    this.gapDistributionData = gapData;
    this.maxMainGapThreshold = range[0];
    this.maxLuckyGapThreshold = range[1];

    this.maxMultiplesAllowed = this.generateMaxMultiplesAllowed(
      lotteryNumbers,
      Array.from({ length: 9 }, (_, i) => i + 2), // 2..10
      true,
      debug,
    );

    this.positionCounters = this.getPositionCounters(lotteryNumbers);
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
    const numPositions = lotteryNumbers[0].length ?? 7;

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

    const patternProb = generatePatternProbabilities(probs);

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

    return topNumbers as LotteryTuple;
  }

  analyzeOddEvenDistribution(
    lotteryNumbers: LotteryTuple[],
    mainOnly = true,
    debug = false,
  ): [DistributionAnalysis[], OddRange] {
    const distribution: Record<number, number> = {};
    const distributionAnalysis: DistributionAnalysis[] = [];
    const lengthToCheck = mainOnly ? 5 : lotteryNumbers[0].length;

    for (const draw of lotteryNumbers) {
      const numbers = draw.slice(0, lengthToCheck).map((n) => parseInt(n, 10));
      const oddCount = numbers.reduce(
        (acc, num) => acc + (num % 2 === 1 ? 1 : 0),
        0,
      );
      distribution[oddCount] = (distribution[oddCount] ?? 0) + 1;
    }

    const totalDraws = lotteryNumbers.length;

    for (let oddCount = 0; oddCount <= lengthToCheck; oddCount++) {
      const count = distribution[oddCount] ?? 0;
      const pct = totalDraws ? (count / totalDraws) * 100 : 0;
      const evenCount = lengthToCheck - oddCount;
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
    mainCount = 5,
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
    countMain = 5,
    countLucky = 2,
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
    countMain = 5,
    countLucky = 2,
  ): GapDistribution {
    const mainGapCounters: Array<Record<number, number>> = Array.from(
      { length: countMain - 1 },
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
    bases: number[] = Array.from({ length: 9 }, (_, i) => i + 2), // 2..10
    mainOnly = true,
    debug = false,
  ): Record<number, number> {
    const maxMultiplesDict: Record<number, number> = {};

    for (const base of bases) {
      const { maxAllowed } = this.analyzeMultiplesDistribution(
        lotteryNumbers,
        base,
        mainOnly,
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
    base = 3,
    mainOnly = true,
    debug = false,
  ): MultiplesDistributionResult {
    const distribution: Record<number, number> = {};
    const exampleDraws: LotteryTuple[] = [];

    const lengthToCheck = mainOnly ? 5 : lotteryNumbers[0].length;
    const multiplesCounts: number[] = [];

    for (const draw of lotteryNumbers) {
      const numbers = draw.slice(0, lengthToCheck).map((n) => parseInt(n, 10));

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
        `\nAnalyzing multiples of ${base} in ${
          mainOnly ? "main numbers only" : "all numbers"
        }:\n`,
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
