import { describe, expect, it } from "vitest";
import {
  countClustersMainNumbers,
  countMaxConsecutiveRun,
  countMultiples,
  generateRandomNumber,
  generateUniqueNumbers,
  isSumInRange,
  maxGapExceedsThreshold,
} from "./utils";

describe("isSumInRange", () => {
  it("returns true when sum is within bounds (inclusive)", () => {
    expect(isSumInRange([1, 2, 3], 0, 6)).toBe(true);
    expect(isSumInRange([1, 2, 3], 6, 6)).toBe(true);
    expect(isSumInRange([1, 2, 3], 6, 100)).toBe(true);
  });

  it("returns false when sum falls outside bounds", () => {
    expect(isSumInRange([1, 2, 3], 7, 100)).toBe(false);
    expect(isSumInRange([1, 2, 3], 0, 5)).toBe(false);
  });

  it("treats an empty array's sum as 0", () => {
    expect(isSumInRange([], 0, 0)).toBe(true);
    expect(isSumInRange([], 1, 10)).toBe(false);
  });
});

describe("maxGapExceedsThreshold", () => {
  it("returns true when any consecutive gap exceeds the threshold", () => {
    expect(maxGapExceedsThreshold([1, 5, 10], 4)).toBe(true);
  });

  it("returns false when no gap exceeds the threshold", () => {
    expect(maxGapExceedsThreshold([1, 5, 10], 5)).toBe(false);
    expect(maxGapExceedsThreshold([1, 2, 3, 4, 5], 1)).toBe(false);
  });

  it("returns false for arrays of length 0 or 1 (no gaps to compare)", () => {
    expect(maxGapExceedsThreshold([], 0)).toBe(false);
    expect(maxGapExceedsThreshold([42], 0)).toBe(false);
  });
});

describe("countMultiples", () => {
  it("counts numbers divisible by base", () => {
    expect(countMultiples([1, 2, 3, 4, 5, 6], 2)).toBe(3);
    expect(countMultiples([1, 2, 3, 4, 5, 6], 3)).toBe(2);
  });

  it("treats 0 as a multiple of any non-zero base", () => {
    expect(countMultiples([0, 5, 10], 5)).toBe(3);
  });

  it("returns 0 when no numbers match", () => {
    expect(countMultiples([1, 3, 5, 7], 2)).toBe(0);
  });

  it("returns 0 for an empty array", () => {
    expect(countMultiples([], 7)).toBe(0);
  });
});

describe("countClustersMainNumbers", () => {
  it("buckets numbers into 5 groups of 10 by default (1–50)", () => {
    expect(countClustersMainNumbers([1, 11, 21, 31, 41])).toEqual({
      0: 1,
      1: 1,
      2: 1,
      3: 1,
      4: 1,
    });
  });

  it("counts multiple numbers landing in the same bucket", () => {
    expect(countClustersMainNumbers([1, 5, 10, 15, 20])).toEqual({
      0: 3, // 1, 5, 10
      1: 2, // 15, 20
      2: 0,
      3: 0,
      4: 0,
    });
  });

  it("respects custom maxValue and groupSize", () => {
    // 0..9 in 5-buckets-of-2: groups 0:{1,2}, 1:{3,4}, 2:{5,6}, 3:{7,8}, 4:{9,10}
    expect(countClustersMainNumbers([1, 3, 5], 10, 2)).toEqual({
      0: 1,
      1: 1,
      2: 1,
      3: 0,
      4: 0,
    });
  });
});

describe("countMaxConsecutiveRun", () => {
  it("returns 0 for empty input", () => {
    expect(countMaxConsecutiveRun([])).toBe(0);
  });

  it("returns 1 when no two numbers are consecutive", () => {
    expect(countMaxConsecutiveRun([1, 3, 5, 8])).toBe(1);
  });

  it("finds the longest run of consecutives", () => {
    expect(countMaxConsecutiveRun([1, 2, 3, 7, 8])).toBe(3);
    expect(countMaxConsecutiveRun([1, 2, 5, 6, 7, 8, 20])).toBe(4);
  });

  it("returns the run length when the entire array is consecutive", () => {
    expect(countMaxConsecutiveRun([10, 11, 12, 13])).toBe(4);
  });

  it("does not depend on input order (sorts defensively)", () => {
    expect(countMaxConsecutiveRun([8, 1, 7, 2, 3])).toBe(3);
    expect(countMaxConsecutiveRun([20, 8, 7, 6, 5, 2, 1])).toBe(4);
  });

  it("does not mutate the input array", () => {
    const xs = [3, 1, 2];
    countMaxConsecutiveRun(xs);
    expect(xs).toEqual([3, 1, 2]);
  });
});

describe("generateRandomNumber", () => {
  it("returns a value within [min, max] inclusive across many samples", () => {
    for (let i = 0; i < 200; i++) {
      const n = generateRandomNumber(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("returns the singleton when min === max", () => {
    expect(generateRandomNumber(5, 5)).toBe(5);
  });
});

describe("generateUniqueNumbers", () => {
  it("returns a sorted array of `count` distinct integers in range", () => {
    const nums = generateUniqueNumbers(5, 1, 50);
    expect(nums).toHaveLength(5);
    expect(new Set(nums).size).toBe(5);
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(50);
    }
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums).toEqual(sorted);
  });

  it("avoids combinations already in the existing set", () => {
    // Force the only possible combo to be excluded — function must throw.
    const existing = new Set<string>(["1,2"]);
    expect(() =>
      generateUniqueNumbers(2, 1, 2, existing, /* maxAttempts */ 50),
    ).toThrow();
  });

  it("succeeds when the existing set leaves at least one combo available", () => {
    // Two possible combos in 1..2 choose 2 — wait, only one: [1,2]. Use 1..3 choose 2: [1,2],[1,3],[2,3]
    const existing = new Set<string>(["1,2", "1,3"]);
    const nums = generateUniqueNumbers(2, 1, 3, existing, 100);
    expect(nums).toEqual([2, 3]);
  });
});
