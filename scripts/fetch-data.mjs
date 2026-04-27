import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_SOURCES } from "./data-sources.mjs";

const fetchOne = async ({ id, url, outFile, parser }) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "github-actions-fetch/1.0",
      Accept: "text/csv, text/plain, */*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[${id}] Fetch failed ${res.status} ${res.statusText}\n${text.slice(0, 500)}`,
    );
  }

  const csv = await res.text();
  const { dates, results } = parser(csv);

  if (results.length === 0) {
    throw new Error(`[${id}] Parser returned 0 rows`);
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: url,
    dates,
    results,
  };

  const newText = JSON.stringify(payload, null, 2) + "\n";

  await fs.mkdir(path.dirname(outFile), { recursive: true });

  let oldText = "";
  try {
    oldText = await fs.readFile(outFile, "utf8");
  } catch {}

  // Compare hash on the data fields only (ignoring fetchedAt) so
  // re-running on a quiet day doesn't churn the file. JSON.stringify is
  // stable for the simple shape we have.
  const hashable = (text) => {
    if (!text) return "";
    try {
      const parsed = JSON.parse(text);
      const stripped = { dates: parsed.dates, results: parsed.results };
      return JSON.stringify(stripped);
    } catch {
      return text;
    }
  };

  const oldHash = crypto
    .createHash("sha256")
    .update(hashable(oldText))
    .digest("hex");
  const newHash = crypto
    .createHash("sha256")
    .update(hashable(newText))
    .digest("hex");

  if (oldHash === newHash) {
    console.log(`[${id}] No data change; skipping write.`);
    return false;
  }

  await fs.writeFile(outFile, newText, "utf8");
  console.log(`[${id}] Wrote ${outFile} with ${results.length} rows`);
  return true;
};

const main = async () => {
  // Optional CLI arg: --game <id> to fetch only one game.
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--game");
  const onlyId = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  const sources = onlyId
    ? DATA_SOURCES.filter((s) => s.id === onlyId)
    : DATA_SOURCES;

  if (onlyId && sources.length === 0) {
    throw new Error(
      `--game ${onlyId} matched no entry in DATA_SOURCES (known: ${DATA_SOURCES.map((s) => s.id).join(", ")})`,
    );
  }

  let failures = 0;
  for (const source of sources) {
    try {
      await fetchOne(source);
    } catch (err) {
      failures += 1;
      console.error(err);
    }
  }

  if (failures > 0) {
    throw new Error(`${failures} game fetch(es) failed; see logs above.`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
