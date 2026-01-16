import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const URL =
  "https://lottery.merseyworld.com/cgi-bin/lottery?days=20&Machine=Z&Ballset=0&order=1&show=1&year=0&display=CSV";

// where you want to write it (public is convenient for Next.js)
const OUT_FILE = "public/data/external-data.json";

const parseLotteryCsv = (csvText) => {
  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim());
  const lines = rawLines.filter(Boolean);

  const headerIndex = lines.findIndex(
    (line) =>
      line.includes("N1") &&
      line.includes("N2") &&
      line.includes("L1") &&
      line.includes("L2")
  );

  if (headerIndex === -1) {
    throw new Error(
      `Could not find lottery CSV header line. First lines: ${lines
        .slice(0, 5)
        .join(" | ")}`
    );
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim());
  const cols = ["N1", "N2", "N3", "N4", "N5", "L1", "L2"];
  const colIndexes = cols.map((col) => headers.indexOf(col));

  if (colIndexes.some((i) => i === -1)) {
    throw new Error(`Missing expected columns. Headers: ${headers.join(", ")}`);
  }

  /** @type {string[][]} */
  const results = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("* * *") || line.startsWith("All lotteries")) break;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < headers.length) continue;

    try {
      const tuple = colIndexes.map((idx) => {
        const n = parseInt(parts[idx], 10);
        if (Number.isNaN(n)) throw new Error("Not a number");
        return n.toString().padStart(2, "0");
      });

      // Ensure exactly 7 entries
      if (tuple.length === 7) results.push(tuple);
    } catch {
      continue;
    }
  }

  return results;
};

const main = async () => {
  // Ensure output directory exists
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "User-Agent": "github-actions-fetch/1.0",
      Accept: "text/csv, text/plain, */*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Fetch failed ${res.status} ${res.statusText}\n${text.slice(0, 500)}`
    );
  }

  const csv = await res.text();
  const tuples = parseLotteryCsv(csv);

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: URL,
    results: tuples, // array of 7-string arrays
  };

  const newText = JSON.stringify(payload, null, 2) + "\n";

  let oldText = "";
  try {
    oldText = await fs.readFile(OUT_FILE, "utf8");
  } catch {}

  const oldHash = crypto.createHash("sha256").update(oldText).digest("hex");
  const newHash = crypto.createHash("sha256").update(newText).digest("hex");

  if (oldHash === newHash) {
    console.log("No changes; skipping write/commit.");
    return;
  }

  await fs.writeFile(OUT_FILE, newText, "utf8");
  console.log(`Wrote ${OUT_FILE} with ${tuples.length} rows`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
