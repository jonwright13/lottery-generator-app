import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a random integer between minValue and maxValue (inclusive)
export function generateRandomNumber(
  minValue: number,
  maxValue: number
): number {
  const min = Math.ceil(minValue);
  const max = Math.floor(maxValue);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate `count` unique random integers between minValue and maxValue (inclusive),
 * avoiding any combination already in `existingCombinations`.
 *
 * `existingCombinations` is a Set of serialized combinations (e.g. "1,5,12,33,45").
 */
export function generateUniqueNumbers(
  count: number,
  minValue: number,
  maxValue: number,
  existingCombinations?: Set<string>,
  maxAttempts = 1000
): number[] {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const numbersSet = new Set<number>();

    while (numbersSet.size < count) {
      const num = generateRandomNumber(minValue, maxValue);
      numbersSet.add(num);
    }

    const numbers = Array.from(numbersSet).sort((a, b) => a - b);
    const key = numbers.join(",");

    if (!existingCombinations || !existingCombinations.has(key)) {
      return numbers;
    }

    attempts += 1;
  }

  throw new Error("Could not generate a unique number set after max attempts");
}

/**
 * Return the length of the longest consecutive run in the sorted list.
 */
export function countMaxConsecutiveRun(numbers: number[]): number {
  if (!numbers.length) return 0;

  let maxRun = 1;
  let currentRun = 1;

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === numbers[i - 1] + 1) {
      currentRun += 1;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 1;
    }
  }

  return maxRun;
}

/**
 * Count how many main numbers fall into each cluster.
 *
 * Example: maxValue=50, groupSize=10 → groups:
 *   0: 1–10, 1: 11–20, 2: 21–30, 3: 31–40, 4: 41–50
 *
 * Returns an object like {0: 2, 1: 0, 2: 1, 3: 2, 4: 0}
 */
export function countClustersMainNumbers(
  mainNums: number[],
  maxValue = 50,
  groupSize = 10
): Record<number, number> {
  const groupCounts: Record<number, number> = {};
  const numGroups = Math.floor((maxValue + groupSize - 1) / groupSize);

  // Initialize counts
  for (let i = 0; i < numGroups; i++) {
    groupCounts[i] = 0;
  }

  for (const num of mainNums) {
    const groupIndex = Math.floor((num - 1) / groupSize);
    if (groupIndex in groupCounts) {
      groupCounts[groupIndex] += 1;
    }
  }

  return groupCounts;
}

/**
 * Count how many numbers in `numbers` are multiples of `base`.
 */
export function countMultiples(numbers: number[], base: number): number {
  return numbers.reduce((acc, num) => acc + (num % base === 0 ? 1 : 0), 0);
}

/**
 * Returns true if any consecutive gap in sorted mainNums exceeds maxGapAllowed.
 */
export function maxGapExceedsThreshold(
  mainNums: number[],
  maxGapAllowed = 15
): boolean {
  for (let i = 0; i < mainNums.length - 1; i++) {
    const gap = mainNums[i + 1] - mainNums[i];
    if (gap > maxGapAllowed) return true;
  }
  return false;
}

/**
 * Returns true if the sum of mainNums is within [minSum, maxSum].
 */
export function isSumInRange(
  mainNums: number[],
  minSum: number,
  maxSum: number
): boolean {
  const total = mainNums.reduce((acc, n) => acc + n, 0);
  return total >= minSum && total <= maxSum;
}
