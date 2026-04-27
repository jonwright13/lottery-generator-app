import type { GameConfig } from "./types";

/**
 * EuroMillions (UK) — 5 mains 1–50 + 2 Lucky Stars 1–12.
 *
 * Lucky Stars pool changed from 1–11 to 1–12 on 24 September 2016. Only
 * post-cutoff draws should be loaded into `euromillions.json`; the fetch
 * script enforces that, so the runtime can assume the 1–12 shape.
 *
 * Prize tiers ordered by descending official prize value (12 tiers).
 */
export const EUROMILLIONS: GameConfig = {
  id: "euromillions",
  name: "EuroMillions",
  drawDays: "Tue & Fri",
  main: { count: 5, min: 1, max: 50, label: "Main", pluralLabel: "Main" },
  bonus: { count: 2, min: 1, max: 12, label: "Star", pluralLabel: "Stars" },
  dataPath: "/data/euromillions.json",
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
    [3, 0],
    [1, 2],
    [2, 1],
  ] as const,
};
