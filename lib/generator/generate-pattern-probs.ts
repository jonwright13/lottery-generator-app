interface PatternDef {
  countMain: number;
  countLucky: number;
  // 1-indexed lucky position to use when countLucky === 1; null otherwise.
  special: number | null;
}

const PATTERNS: PatternDef[] = [
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

const TOTAL_MAIN_POSITIONS = 5;

function pickPatternProbs(
  probs: number[],
  { countMain, countLucky, special }: PatternDef,
): number[] {
  const picked: number[] = [];

  for (let i = 0; i < countMain && i < probs.length; i++) {
    picked.push(probs[i]);
  }

  if (countLucky === 2) {
    for (let i = 0; i < 2; i++) {
      const idx = TOTAL_MAIN_POSITIONS + i;
      if (idx < probs.length) picked.push(probs[idx]);
    }
  } else if (countLucky === 1 && special !== null) {
    const idx = TOTAL_MAIN_POSITIONS + (special - 1);
    if (idx < probs.length) picked.push(probs[idx]);
  }

  return picked;
}

export function generatePatternProbabilities(
  probs: number[],
): Record<string, number> {
  const patternProb: Record<string, number> = {};

  for (const pattern of PATTERNS) {
    const slice = pickPatternProbs(probs, pattern);
    const avg = slice.length
      ? slice.reduce((a, b) => a + b, 0) / slice.length
      : 0;

    let key = `${pattern.countMain}_main+${pattern.countLucky}_lucky`;
    if (pattern.special !== null && pattern.countLucky === 1) {
      key += `_special_${pattern.special}`;
    }

    patternProb[key] = avg;
  }

  return patternProb;
}
