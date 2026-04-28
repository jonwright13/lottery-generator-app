import type { GameConfig } from "./types";

/**
 * Thunderball — 5 mains 1–39 + 1 Thunderball 1–14.
 *
 * Current format started 10 May 2010 (matrix moved from 5/34 to 5/39).
 * Only post-cutoff draws should be loaded into `thunderball.json`; the
 * fetch script enforces that, so the runtime can assume the 1–39 main
 * shape.
 *
 * Prize tiers ordered by descending official prize value (9 tiers).
 * Note the unusual `[0, 1]` tier — matching just the Thunderball wins
 * £3, even with zero mains right. `countMatchesByTier` keys on the
 * `(mainHits, bonusHits)` pair regardless, so this works without
 * special-casing.
 *
 * No prize is awarded for matching only mains without the Thunderball
 * below 3 (i.e. there is no `[2, 0]` or `[1, 0]` tier). Tiers below
 * are exhaustive of every paying combination.
 */
export const THUNDERBALL: GameConfig = {
  id: "thunderball",
  name: "Thunderball",
  drawDays: "Tue, Wed, Fri & Sat",
  main: { count: 5, min: 1, max: 39, label: "Main", pluralLabel: "Main" },
  bonus: {
    count: 1,
    min: 1,
    max: 14,
    label: "Thunder",
    pluralLabel: "Thunder",
  },
  dataPath: "/data/thunderball.json",
  prizeTiers: [
    [5, 1],
    [5, 0],
    [4, 1],
    [4, 0],
    [3, 1],
    [3, 0],
    [2, 1],
    [1, 1],
    [0, 1],
  ] as const,
};
