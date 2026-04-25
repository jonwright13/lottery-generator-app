import { describe, expect, it } from "vitest";
import { generatePatternProbabilities } from "./generate-pattern-probs";

// probs is a 7-position array: [N1, N2, N3, N4, N5, L1, L2]
const probs = [10, 20, 30, 40, 50, 60, 80];

describe("generatePatternProbabilities", () => {
  it("returns the expected pattern keys", () => {
    const result = generatePatternProbabilities(probs);
    expect(Object.keys(result).sort()).toEqual(
      [
        "5_main+2_lucky",
        "5_main+1_lucky_special_1",
        "5_main+1_lucky_special_2",
        "5_main+0_lucky",
        "4_main+2_lucky",
        "4_main+1_lucky_special_1",
        "4_main+1_lucky_special_2",
        "3_main+2_lucky",
        "4_main+0_lucky",
        "2_main+2_lucky",
        "3_main+1_lucky_special_1",
        "3_main+1_lucky_special_2",
      ].sort(),
    );
  });

  it("averages all 5 main + both lucky for 5_main+2_lucky", () => {
    const r = generatePatternProbabilities(probs);
    expect(r["5_main+2_lucky"]).toBeCloseTo((10 + 20 + 30 + 40 + 50 + 60 + 80) / 7);
  });

  it("uses L1 (probs[5]) for special_1 variants", () => {
    const r = generatePatternProbabilities(probs);
    // 5 main + L1 = (10+20+30+40+50+60)/6
    expect(r["5_main+1_lucky_special_1"]).toBeCloseTo(
      (10 + 20 + 30 + 40 + 50 + 60) / 6,
    );
    // 4 main + L1 = (10+20+30+40+60)/5
    expect(r["4_main+1_lucky_special_1"]).toBeCloseTo(
      (10 + 20 + 30 + 40 + 60) / 5,
    );
  });

  it("uses L2 (probs[6]) for special_2 variants", () => {
    const r = generatePatternProbabilities(probs);
    // 5 main + L2 = (10+20+30+40+50+80)/6
    expect(r["5_main+1_lucky_special_2"]).toBeCloseTo(
      (10 + 20 + 30 + 40 + 50 + 80) / 6,
    );
    // 4 main + L2 = (10+20+30+40+80)/5
    expect(r["4_main+1_lucky_special_2"]).toBeCloseTo(
      (10 + 20 + 30 + 40 + 80) / 5,
    );
  });

  it("special_1 and special_2 produce different values when L1 != L2", () => {
    const r = generatePatternProbabilities(probs);
    expect(r["5_main+1_lucky_special_1"]).not.toBeCloseTo(
      r["5_main+1_lucky_special_2"],
    );
  });

  it("averages only the main slice for 0-lucky patterns", () => {
    const r = generatePatternProbabilities(probs);
    expect(r["5_main+0_lucky"]).toBeCloseTo(
      (10 + 20 + 30 + 40 + 50) / 5,
    );
    expect(r["4_main+0_lucky"]).toBeCloseTo((10 + 20 + 30 + 40) / 4);
  });

  it("returns 0 for a pattern when probs is empty", () => {
    const r = generatePatternProbabilities([]);
    for (const v of Object.values(r)) {
      expect(v).toBe(0);
    }
  });
});
