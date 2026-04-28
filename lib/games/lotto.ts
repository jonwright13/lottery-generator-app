import type { GameConfig } from "./types";

/**
 * UK Lotto — 6 mains 1–59 + 1 Bonus Ball drawn from the same 1–59 pool.
 *
 * The ball pool changed from 1–49 to 1–59 on 10 October 2015. Only
 * post-cutoff draws should be loaded into `lotto.json`; the fetch script
 * enforces that, so the runtime can assume the 1–59 shape.
 *
 * The Bonus Ball is drawn after the six main numbers from the remaining
 * 53 balls in the same physical machine — i.e. it shares the 1–59 pool
 * but is structurally a separate slot. Modeling it as `bonus.count = 1`
 * with the same min/max as `main` lets `ThresholdCriteria` analyse it as
 * a distinct dimension (its own gap threshold, position counter, etc.)
 * without the caller needing to special-case shared-pool games.
 *
 * Prize tiers ordered by descending official prize value (6 tiers). The
 * Match-2 tier wins a free Lucky Dip rather than cash, but is still a
 * valid match category so we include it.
 */
export const LOTTO: GameConfig = {
  id: "lotto",
  name: "Lotto",
  drawDays: "Wed & Sat",
  main: { count: 6, min: 1, max: 59, label: "Main", pluralLabel: "Main" },
  bonus: { count: 1, min: 1, max: 59, label: "Bonus", pluralLabel: "Bonus" },
  dataPath: "/data/lotto.json",
  prizeTiers: [
    [6, 0],
    [5, 1],
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
  ] as const,
};
