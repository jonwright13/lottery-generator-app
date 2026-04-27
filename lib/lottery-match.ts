import type { LotteryTuple } from "@/lib/generator";

export interface MatchTier {
  mainHits: number;
  luckyHits: number;
  draws: number;
}

// Ordered by descending prize-tier significance, mirroring the taxonomy in
// generate-pattern-probs.ts but collapsed to set-based matching (no
// positional special_1/special_2 distinction — actual lottery prizes don't
// care which of your two lucky numbers landed).
const TIER_ORDER: ReadonlyArray<[number, number]> = [
  [5, 2],
  [5, 1],
  [5, 0],
  [4, 2],
  [4, 1],
  [3, 2],
  [4, 0],
  [2, 2],
  [3, 1],
];

const MAIN_COUNT = 5;

export function countMatchesByTier(
  userMain: string[],
  userLucky: string[],
  draws: LotteryTuple[],
): MatchTier[] {
  const userMainSet = new Set(userMain);
  const userLuckySet = new Set(userLucky);
  const counts = new Map<string, number>();

  for (const draw of draws) {
    let mainHits = 0;
    for (let i = 0; i < MAIN_COUNT; i++) {
      if (userMainSet.has(draw[i])) mainHits++;
    }
    let luckyHits = 0;
    for (let i = MAIN_COUNT; i < draw.length; i++) {
      if (userLuckySet.has(draw[i])) luckyHits++;
    }
    const key = `${mainHits},${luckyHits}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return TIER_ORDER.map(([mainHits, luckyHits]) => ({
    mainHits,
    luckyHits,
    draws: counts.get(`${mainHits},${luckyHits}`) ?? 0,
  }));
}
