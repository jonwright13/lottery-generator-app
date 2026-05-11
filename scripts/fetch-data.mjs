import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_SOURCES } from "./data-sources.mjs";

const fetchOne = async ({ id, outFile, source, fetch: fetchFn }) => {
  const { dates, results } = await fetchFn();

  if (results.length === 0) {
    throw new Error(`[${id}] Source returned 0 rows`);
  }

  if (dates.length !== results.length) {
    throw new Error(
      `[${id}] dates/results length mismatch (${dates.length} vs ${results.length})`,
    );
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    source,
    dates,
    results,
  };

  const newText = JSON.stringify(payload, null, 2) + "\n";

  await fs.mkdir(path.dirname(outFile), { recursive: true });

  let oldText = "";
  try {
    oldText = await fs.readFile(outFile, "utf8");
  } catch {}

  // Compare hash on the data fields only (ignoring fetchedAt) so re-running
  // on a quiet day doesn't churn the file. JSON.stringify is stable for the
  // simple shape we have.
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
  // CLI args:
  //   --game <id>  fetch only one game (also bypasses the day filter)
  //   --force      bypass the per-source `updateDays` filter
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--game");
  const onlyId = onlyIdx !== -1 ? args[onlyIdx + 1] : null;
  const force = args.includes("--force") || onlyId !== null;

  const candidates = onlyId
    ? DATA_SOURCES.filter((s) => s.id === onlyId)
    : DATA_SOURCES;

  if (onlyId && candidates.length === 0) {
    throw new Error(
      `--game ${onlyId} matched no entry in DATA_SOURCES (known: ${DATA_SOURCES.map((s) => s.id).join(", ")})`,
    );
  }

  const today = new Date().getUTCDay();
  const sources = force
    ? candidates
    : candidates.filter((s) => {
        if (!Array.isArray(s.updateDays) || s.updateDays.length === 0) {
          return true;
        }
        if (s.updateDays.includes(today)) return true;
        console.log(
          `[${s.id}] No draw expected today (UTC day ${today}); skipping.`,
        );
        return false;
      });

  if (sources.length === 0) {
    console.log("Nothing to fetch today.");
    return;
  }

  let failures = 0;
  for (const src of sources) {
    try {
      await fetchOne(src);
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
