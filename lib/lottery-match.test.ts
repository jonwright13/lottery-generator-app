import { describe, expect, it } from "vitest";
import { countMatchesByTier } from "./lottery-match";
import type { LotteryTuple } from "./generator";
import { MERSEYWORLD_SYNTHETIC } from "@/lib/games/merseyworld-synthetic";

const GAME = MERSEYWORLD_SYNTHETIC;

const draw = (
  ...nums: [string, string, string, string, string, string, string]
): LotteryTuple => nums;

describe("countMatchesByTier", () => {
  it("counts a 5+2 jackpot match", () => {
    const draws = [draw("01", "02", "03", "04", "05", "06", "07")];
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      draws,
      GAME,
    );
    expect(tiers[0]).toEqual({
      mainHits: 5,
      luckyHits: 2,
      draws: 1,
      drawIndices: [0],
    });
  });

  it("preserves the original draw indices for each tier", () => {
    const draws: LotteryTuple[] = [
      draw("99", "98", "97", "96", "95", "10", "11"), // 0+0
      draw("01", "02", "03", "04", "05", "06", "07"), // 5+2 (idx 1)
      draw("99", "98", "97", "96", "95", "10", "11"), // 0+0
      draw("01", "02", "03", "04", "99", "06", "07"), // 4+2 (idx 3)
      draw("01", "02", "03", "04", "05", "06", "07"), // 5+2 (idx 4)
    ];
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      draws,
      GAME,
    );
    const find = (m: number, l: number) =>
      tiers.find((t) => t.mainHits === m && t.luckyHits === l);

    expect(find(5, 2)?.drawIndices).toEqual([1, 4]);
    expect(find(4, 2)?.drawIndices).toEqual([3]);
    expect(find(5, 0)?.drawIndices).toEqual([]);
  });

  it("uses set membership, not position, for lucky matches", () => {
    // user's L1 is "06", but the draw stored "06" in the L2 slot
    const draws = [draw("01", "02", "03", "04", "05", "10", "06")];
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      draws,
      GAME,
    );
    expect(tiers).toContainEqual({
      mainHits: 5,
      luckyHits: 1,
      draws: 1,
      drawIndices: [0],
    });
  });

  it("returns 0 for tiers with no matching draws", () => {
    const draws = [draw("01", "02", "03", "04", "05", "06", "07")];
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      draws,
      GAME,
    );
    // exactly one 5+2; every other tier should be 0
    const nonZero = tiers.filter((t) => t.draws > 0);
    expect(nonZero).toHaveLength(1);
  });

  it("aggregates counts across many draws", () => {
    const draws: LotteryTuple[] = [
      draw("01", "02", "03", "04", "05", "06", "07"), // 5+2
      draw("01", "02", "03", "04", "05", "10", "11"), // 5+0
      draw("01", "02", "03", "04", "99", "06", "07"), // 4+2
      draw("01", "02", "03", "04", "99", "10", "11"), // 4+0
      draw("01", "02", "03", "04", "99", "06", "07"), // 4+2 (dup)
    ];
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      draws,
      GAME,
    );
    const get = (m: number, l: number) =>
      tiers.find((t) => t.mainHits === m && t.luckyHits === l)?.draws ?? null;

    expect(get(5, 2)).toBe(1);
    expect(get(5, 0)).toBe(1);
    expect(get(4, 2)).toBe(2);
    expect(get(4, 0)).toBe(1);
  });

  it("returns the canonical 9 tiers in descending significance order", () => {
    const tiers = countMatchesByTier([], [], [], GAME);
    expect(tiers.map((t) => `${t.mainHits}+${t.luckyHits}`)).toEqual([
      "5+2",
      "5+1",
      "5+0",
      "4+2",
      "4+1",
      "3+2",
      "4+0",
      "2+2",
      "3+1",
    ]);
  });

  it("returns all-zero counts when no historical data is provided", () => {
    const tiers = countMatchesByTier(
      ["01", "02", "03", "04", "05"],
      ["06", "07"],
      [],
      GAME,
    );
    for (const t of tiers) expect(t.draws).toBe(0);
  });
});
