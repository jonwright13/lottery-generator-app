import { LotteryTuple } from "@/lib/generator/types";

export const getLatestLotteryNumbers = async (): Promise<LotteryTuple[]> => {
  const url =
    "https://lottery.merseyworld.com/cgi-bin/lottery?days=20&Machine=Z&Ballset=0&order=1&show=1&year=0&display=CSV";

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/csv, text/plain, */*",
    },
  });

  if (!response.ok) {
    console.error("Lottery fetch failed", response.status, response.statusText);
    throw new Error(`Lottery fetch failed with status ${response.status}`);
  }

  const csv = await response.text();

  const rawLines = csv.split(/\r?\n/).map((l) => l.trim());
  const lines = rawLines.filter(Boolean);

  // Find the REAL header line (contains N1..L2)
  const headerIndex = lines.findIndex(
    (line) =>
      line.includes("N1") &&
      line.includes("N2") &&
      line.includes("L1") &&
      line.includes("L2"),
  );

  if (headerIndex === -1) {
    console.error(
      "Could not find header in lottery CSV. First few lines:",
      lines.slice(0, 5),
    );
    throw new Error("Could not find lottery CSV header line");
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim());
  const cols = ["N1", "N2", "N3", "N4", "N5", "L1", "L2"];
  const colIndexes = cols.map((col) => headers.indexOf(col));

  if (colIndexes.some((i) => i === -1)) {
    console.error("Header line did not contain expected columns:", headers);
    throw new Error("Missing expected lottery columns in CSV");
  }

  const results: LotteryTuple[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Stop when we hit the divider / footer
    if (line.startsWith("* * *") || line.startsWith("All lotteries")) break;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < headers.length) continue;

    try {
      const tuple = colIndexes.map((idx) => {
        const n = parseInt(parts[idx], 10);
        if (Number.isNaN(n)) throw new Error("Not a number");
        return n.toString().padStart(2, "0");
      }) as LotteryTuple;

      results.push(tuple);
    } catch {
      // skip malformed rows
      continue;
    }
  }

  console.log("Retrieved latest lottery numbers:", results.length);
  return results;
};
