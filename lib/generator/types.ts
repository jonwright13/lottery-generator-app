export type LotteryTuple = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type OddRange = [number, number];

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
export interface GenerateValidNumberSetResult {
  bestCombination: LotteryTuple | null;
  bestScore: number;
  bestPatternProb: number[] | null;
  iterations: number;
}

export interface GenerateValidNumberSetOptions {
  minMain: number;
  maxMain: number;
  countMain: number;
  minLucky: number;
  maxLucky: number;
  countLucky: number;
  minScore: number;
  maxIterations: number;
  sumMin: number;
  sumMax: number;
  maxMainGapThreshold: number;
  maxLuckyGapThreshold: number;
  oddRange: OddRange;
  maxMultiplesAllowed: Record<number, number>;
  clusterMax: number;
  debug: boolean;
}
