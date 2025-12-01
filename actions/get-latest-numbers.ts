"use server";

import { LotteryTuple } from "@/types";

const url =
  "https://lottery.merseyworld.com/cgi-bin/lottery?days=20&Machine=Z&Ballset=0&order=1&show=1&year=0&display=CSV";

export const getLatestLotteryNumbers = async (): Promise<LotteryTuple[]> => {
  try {
    const response = await fetch(url);
    const csv = await response.text();

    const rawLines = csv.split("\n").map((l) => l.trim());
    // Drop empty lines
    const lines = rawLines.filter(Boolean);

    // Find the real header line (one that contains N1..L2)
    const headerIndex = lines.findIndex(
      (line) =>
        line.includes("N1") &&
        line.includes("N2") &&
        line.includes("L1") &&
        line.includes("L2")
    );

    if (headerIndex === -1) {
      throw new Error("Could not find lottery CSV header line");
    }

    const headers = lines[headerIndex].split(",").map((h) => h.trim());
    const cols = ["N1", "N2", "N3", "N4", "N5", "L1", "L2"];
    const colIndexes = cols.map((col) => headers.indexOf(col));

    if (colIndexes.some((i) => i === -1)) {
      throw new Error("Missing expected lottery columns in CSV");
    }

    const results: LotteryTuple[] = [];

    // Start from the line after the header
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Stop if we hit the "* * *" divider or explanatory text
      if (line.startsWith("* * *") || line.startsWith("All lotteries")) break;

      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < headers.length) continue;

      try {
        const tuple = colIndexes.map((idx) => {
          const num = parseInt(parts[idx], 10);
          if (isNaN(num)) throw new Error("Not a number");
          return num.toString().padStart(2, "0");
        }) as LotteryTuple;

        results.push(tuple);
      } catch {
        // Skip malformed rows
        continue;
      }
    }

    console.log("Retrieved latest lottery numbers");
    return results;
  } catch (err) {
    console.error("Error fetching latest lottery numbers", err);
    return [];
  }
};
