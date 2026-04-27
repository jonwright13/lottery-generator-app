interface PatternDef {
  countMain: number;
  countLucky: number;
  /** 1-indexed lucky position to use when countLucky === 1; null otherwise. */
  special: number | null;
}

/**
 * Build the list of "interesting" partial-match patterns to score.
 *
 * For mainCount=5, bonusCount=2 this matches the original hard-coded list:
 * 5+2, 5+1 (s1), 5+1 (s2), 5+0, 4+2, 4+1 (s1), 4+1 (s2), 3+2, 4+0, 2+2, 3+1
 * (s1), 3+1 (s2). For other shapes we generate the same family in descending
 * prize-significance order: full-match first, then drop a bonus, then drop
 * mains, etc. When bonusCount === 1 there's only one "special" so the s1/s2
 * variants collapse.
 */
const buildPatterns = (mainCount: number, bonusCount: number): PatternDef[] => {
  const out: PatternDef[] = [];
  // Match main from full-down-to-2; for each, every bonus count from full-down-to-0.
  for (let m = mainCount; m >= 2; m--) {
    for (let b = bonusCount; b >= 0; b--) {
      if (b === 1 && bonusCount > 1) {
        // expand to one entry per "special" position when there's >1 bonus slot
        for (let s = 1; s <= bonusCount; s++) {
          out.push({ countMain: m, countLucky: 1, special: s });
        }
      } else {
        out.push({ countMain: m, countLucky: b, special: null });
      }
    }
  }
  // Trim to the same shape as the original hard-coded list (for 5+2 the
  // canonical 12-entry set): keep mains >= 3 (or full-bonus 2-mains),
  // and only keep zero-bonus rows for the top 2 main counts.
  return out.filter(
    (p) =>
      (p.countMain >= 3 || (p.countMain === 2 && p.countLucky === bonusCount)) &&
      (p.countLucky > 0 || p.countMain >= mainCount - 1),
  );
};

const pickPatternProbs = (
  probs: number[],
  totalMainPositions: number,
  bonusCount: number,
  { countMain, countLucky, special }: PatternDef,
): number[] => {
  const picked: number[] = [];

  for (let i = 0; i < countMain && i < probs.length; i++) {
    picked.push(probs[i]);
  }

  if (countLucky === bonusCount) {
    for (let i = 0; i < bonusCount; i++) {
      const idx = totalMainPositions + i;
      if (idx < probs.length) picked.push(probs[idx]);
    }
  } else if (countLucky === 1 && special !== null) {
    const idx = totalMainPositions + (special - 1);
    if (idx < probs.length) picked.push(probs[idx]);
  } else if (countLucky > 0) {
    // Generic case: take the first `countLucky` bonuses.
    for (let i = 0; i < countLucky; i++) {
      const idx = totalMainPositions + i;
      if (idx < probs.length) picked.push(probs[idx]);
    }
  }

  return picked;
};

export const generatePatternProbabilities = (
  probs: number[],
  mainCount = 5,
  bonusCount = 2,
): Record<string, number> => {
  const patternProb: Record<string, number> = {};
  const patterns = buildPatterns(mainCount, bonusCount);

  for (const pattern of patterns) {
    const slice = pickPatternProbs(probs, mainCount, bonusCount, pattern);
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
};
