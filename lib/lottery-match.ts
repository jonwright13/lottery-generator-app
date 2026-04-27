import type { LotteryTuple } from "@/lib/generator";

export interface MatchTier {
  mainHits: number;
  luckyHits: number;
  draws: number;
  drawIndices: number[];
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
  const indices = new Map<string, number[]>();

  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i];
    let mainHits = 0;
    for (let j = 0; j < MAIN_COUNT; j++) {
      if (userMainSet.has(draw[j])) mainHits++;
    }
    let luckyHits = 0;
    for (let j = MAIN_COUNT; j < draw.length; j++) {
      if (userLuckySet.has(draw[j])) luckyHits++;
    }
    const key = `${mainHits},${luckyHits}`;
    const list = indices.get(key);
    if (list) {
      list.push(i);
    } else {
      indices.set(key, [i]);
    }
  }

  return TIER_ORDER.map(([mainHits, luckyHits]) => {
    const drawIndices = indices.get(`${mainHits},${luckyHits}`) ?? [];
    return {
      mainHits,
      luckyHits,
      draws: drawIndices.length,
      drawIndices,
    };
  });
}
