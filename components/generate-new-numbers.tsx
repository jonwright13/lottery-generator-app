"use client";

import { getLatestLotteryNumbers } from "@/actions/get-latest-numbers";
import {
  generateValidNumberSet,
  GenerateValidNumberSetResult,
} from "@/lib/generate-number-set";
import { ThresholdCriteria } from "@/lib/threshold-criteria";
import { useState } from "react";

export const GenerateNumbersContainer = () => {
  const [results, setResults] = useState<GenerateValidNumberSetResult | null>(
    null
  );
  const handleGenerate = async () => {
    const lotteryNumbers = await getLatestLotteryNumbers();
    const thresholdCriteria = new ThresholdCriteria(lotteryNumbers, false);

    const res = generateValidNumberSet(lotteryNumbers, {
      minScore: 5,
      maxIterations: 100_000_000,
      sumMin: thresholdCriteria.sumMin,
      sumMax: thresholdCriteria.sumMax,
      maxMainGapThreshold: thresholdCriteria.maxMainGapThreshold,
      maxLuckyGapThreshold: thresholdCriteria.maxLuckyGapThreshold,
      maxMultiplesAllowed: thresholdCriteria.maxMultiplesAllowed,
      oddRange: thresholdCriteria.oddRange,
      patternProbThreshold: 8,
      debug: false,
    });

    setResults(res);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-lg font-semibold">Generate</h2>
      <button
        onClick={handleGenerate}
        className="px-2 py-1 border rounded-md cursor-pointer"
      >
        Generate
      </button>
      <ul className="flex gap-x-2 items-center">
        {results?.bestCombination?.map((n, index) => (
          <li key={index}>{n}</li>
        ))}
      </ul>
    </div>
  );
};
