/**
 * A single historical draw, flat: `[...mains, ...bonuses]`.
 *
 * Length is per-game (`main.count + bonus.count`) — the type is just `string[]`
 * because TypeScript can't easily express "tuple of length N where N is read
 * from runtime config". Consumers slice using the active GameConfig's
 * `main.count` / `bonus.count` rather than hard-coded constants.
 */
export type LotteryTuple = string[];

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
export interface RejectionCounts {
  generation_duplicate: number;
  exceed_multiples: number;
  max_run: number;
  cluster_count: number;
  odd_even_balance: number;
  gap_exceeds_threshold: number;
  sum_in_range: number;
  historical_duplicate: number;
  last_digit_repeat: number;
  previous_draw_overlap: number;
  arithmetic_progression: number;
}

export interface GenerateValidNumberSetResult {
  bestCombination: LotteryTuple | null;
  bestScore: number;
  bestPairScore: number;
  bestRecentScore: number;
  bestPatternProb: number[] | null;
  iterations: number;
  rejections: RejectionCounts;
}

export type UpdateOptions = <K extends keyof GenerateValidNumberSetOptions>(
  key: K,
  value: GenerateValidNumberSetOptions[K],
) => void;

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
  clusterGroupSize: number;
  maxSameLastDigit: number;
  maxPreviousDrawOverlap: number;
  pairScoreWeight: number;
  recentWindowSize: number;
  recentBias: number;
  debug: boolean;
}
