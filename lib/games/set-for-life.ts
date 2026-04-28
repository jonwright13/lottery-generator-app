import type { GameConfig } from "./types";

/**
 * Set For Life — 5 mains 1–47 + 1 Life Ball 1–10.
 *
 * Game launched 18 March 2019 with no format changes since, so the
 * cutoff in the fetch script is the launch date itself; every drawn
 * result lives under the modern shape.
 *
 * Prize tiers ordered by descending official prize value (9 tiers):
 *   5+Life — Top Prize (£10k/month × 30 yrs)
 *   5      — 2nd Prize (£10k/month × 1 yr)
 *   4+Life — £250
 *   4      — £50
 *   3+Life — £30
 *   3      — £20
 *   2+Life — £10
 *   2      — £5
 *   1+Life — Free Lucky Dip
 */
export const SET_FOR_LIFE: GameConfig = {
  id: "set-for-life",
  name: "Set For Life",
  drawDays: "Mon & Thu",
  main: { count: 5, min: 1, max: 47, label: "Main", pluralLabel: "Main" },
  bonus: { count: 1, min: 1, max: 10, label: "Life", pluralLabel: "Life" },
  dataPath: "/data/set-for-life.json",
  prizeTiers: [
    [5, 1],
    [5, 0],
    [4, 1],
    [4, 0],
    [3, 1],
    [3, 0],
    [2, 1],
    [2, 0],
    [1, 1],
  ] as const,
};
