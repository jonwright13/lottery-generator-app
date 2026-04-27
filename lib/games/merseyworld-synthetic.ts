import type { GameConfig } from "./types";

/**
 * The original Merseyworld synthetic feed (5 mains 1–50 + 2 lucky 1–11).
 * Not a real UK National Lottery game; preserved here to keep the app
 * functional while real games (EuroMillions, Lotto, Set For Life,
 * Thunderball) are being wired up. Will be retired in the next branch.
 */
export const MERSEYWORLD_SYNTHETIC: GameConfig = {
  id: "merseyworld-synthetic",
  name: "Merseyworld 5/50 + 2/11",
  drawDays: "Tue & Fri",
  main: { count: 5, min: 1, max: 50, label: "Main", pluralLabel: "Main" },
  bonus: { count: 2, min: 1, max: 11, label: "Lucky", pluralLabel: "Lucky" },
  dataPath: "/data/external-data.json",
  prizeTiers: [
    [5, 2],
    [5, 1],
    [5, 0],
    [4, 2],
    [4, 1],
    [3, 2],
    [4, 0],
    [2, 2],
    [3, 1],
  ] as const,
};
