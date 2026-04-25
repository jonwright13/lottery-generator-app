import { describe, expect, it } from "vitest";
import { percentile } from "./utils";

describe("percentile", () => {
  it("returns 0 for an empty array", () => {
    expect(percentile([], 50)).toBe(0);
  });

  it("returns the only value when array has length 1", () => {
    expect(percentile([42], 0)).toBe(42);
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 100)).toBe(42);
  });

  it("returns min for p=0 and max for p=100", () => {
    const xs = [1, 2, 3, 4, 5];
    expect(percentile(xs, 0)).toBe(1);
    expect(percentile(xs, 100)).toBe(5);
  });

  it("returns the median at p=50 for an odd-length array", () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it("interpolates linearly between adjacent ranks", () => {
    // Mirrors numpy.percentile([1,2,3,4], 50) == 2.5
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    // numpy.percentile([1,2,3,4], 25) == 1.75
    expect(percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 10);
  });

  it("does not depend on input order", () => {
    expect(percentile([5, 1, 3, 2, 4], 50)).toBe(3);
    expect(percentile([4, 2, 3, 1], 50)).toBe(2.5);
  });

  it("does not mutate the input array", () => {
    const xs = [3, 1, 2];
    percentile(xs, 50);
    expect(xs).toEqual([3, 1, 2]);
  });
});
