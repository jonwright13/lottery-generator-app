// Example pattern type:
//   count_main: how many main numbers
//   count_lucky: how many lucky numbers
//   special: optional marker (None/null in Python)
export interface PatternDef {
  countMain: number;
  countLucky: number;
  special: number | null;
}

export const PATTERNS: PatternDef[] = [
  { countMain: 5, countLucky: 2, special: null }, // 5 main + 2 specials
  { countMain: 5, countLucky: 1, special: 1 }, // 5 main + first special
  { countMain: 5, countLucky: 1, special: 2 }, // 5 main + second special
  { countMain: 5, countLucky: 0, special: null }, // 5 main only

  { countMain: 4, countLucky: 2, special: null }, // 4 main + 2 specials
  { countMain: 4, countLucky: 1, special: 1 }, // 4 main + first special
  { countMain: 4, countLucky: 1, special: 2 }, // 4 main + second special

  { countMain: 3, countLucky: 2, special: null }, // 3 main + 2 lucky
  { countMain: 4, countLucky: 0, special: null }, // 4 main only

  { countMain: 2, countLucky: 2, special: null }, // 2 main + 2 lucky
  { countMain: 3, countLucky: 1, special: 1 }, // 3 main + first lucky
  { countMain: 3, countLucky: 1, special: 2 }, // 3 main + second lucky
];

export function generatePatternProbabilities(
  probs: number[]
): Record<string, number> {
  const patternProb: Record<string, number> = {};

  for (const pattern of PATTERNS) {
    const { countMain, countLucky, special } = pattern;

    // Determine how many probability positions to slice
    const sliceEnd = countLucky === 0 ? countMain : countMain + countLucky;

    // Extract probabilities corresponding to the pattern
    const patternSlice = probs.slice(0, sliceEnd);

    // Compute average
    const avg =
      patternSlice.length > 0
        ? patternSlice.reduce((a, b) => a + b, 0) / patternSlice.length
        : 0;

    // Build key
    let key = `${countMain}_main+${countLucky}_lucky`;

    if (special !== null && countLucky === 1) {
      key += `_special_${special}`;
    }

    patternProb[key] = avg;
  }

  return patternProb;
}
