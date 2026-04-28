import type { GameConfig } from "@/lib/games";
import type { LotteryTuple } from "@/lib/generator";

export interface MatchTier {
  mainHits: number;
  luckyHits: number;
  draws: number;
  drawIndices: number[];
}

/**
 * Count how many historical draws fall into each prize tier when matched
 * against the user's mains + bonuses. Tier order and significance comes
 * from `game.prizeTiers` so that swapping games (Lotto vs EuroMillions vs
 * Set For Life) automatically rewires which (mainHits, luckyHits) rows
 * appear and in what order.
 */
export function countMatchesByTier(
  userMain: string[],
  userLucky: string[],
  draws: LotteryTuple[],
  game: GameConfig,
): MatchTier[] {
  const userMainSet = new Set(userMain);
  const userLuckySet = new Set(userLucky);
  const indices = new Map<string, number[]>();
  const mainCount = game.main.count;

  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i];
    let mainHits = 0;
    for (let j = 0; j < mainCount; j++) {
      if (userMainSet.has(draw[j])) mainHits++;
    }
    let luckyHits = 0;
    for (let j = mainCount; j < draw.length; j++) {
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

  return game.prizeTiers.map(([mainHits, luckyHits]) => {
    const drawIndices = indices.get(`${mainHits},${luckyHits}`) ?? [];
    return {
      mainHits,
      luckyHits,
      draws: drawIndices.length,
      drawIndices,
    };
  });
}
