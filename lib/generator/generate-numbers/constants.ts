interface IterationCheck {
  generation_duplicate: number;
  exceed_multiples: number;
  max_run: number;
  cluster_count: number;
  odd_even_balance: number;
  gap_exceeds_threshold: number;
  sum_in_range: number;
  historical_duplicate: number;
  pattern_prob_threshold: number;
}

export const iterationCheckDict: IterationCheck = {
  generation_duplicate: 0,
  exceed_multiples: 0,
  max_run: 0,
  cluster_count: 0,
  odd_even_balance: 0,
  gap_exceeds_threshold: 0,
  sum_in_range: 0,
  historical_duplicate: 0,
  pattern_prob_threshold: 0,
};
