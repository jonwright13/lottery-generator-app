/**
 * Per-game CSV fetch URLs + parsers.
 *
 * Build-time only. Mirrors the runtime `lib/games/<id>.ts` GameConfig by id;
 * the duplication is intentional so the fetch script can stay plain ESM JS
 * (no tsx / ts-node) while the runtime side stays in TS.
 *
 * Each parser receives the raw CSV text and returns:
 *   { dates: string[], results: string[][] }
 * where dates are ISO YYYY-MM-DD and each results entry is a flat array of
 * `mainCount + bonusCount` zero-padded 2-digit strings ([m1..mN, b1..bM]).
 */

const padNum = (raw) => {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Not a number: ${raw}`);
  return n.toString().padStart(2, "0");
};

const MONTH_MAP = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const parseDdMmmYyyy = (raw) => {
  // national-lottery.co.uk dates: "24-Apr-2026" or "07-Jan-2020"
  const [ddRaw, mmm, yyyyRaw] = raw.split("-");
  const dd = String(parseInt(ddRaw, 10)).padStart(2, "0");
  const mm = MONTH_MAP[mmm];
  const yyyy = String(parseInt(yyyyRaw, 10));
  if (!mm || !yyyy || Number.isNaN(Number(dd))) {
    throw new Error(`Unparseable date: ${raw}`);
  }
  return `${yyyy}-${mm}-${dd}`;
};

const splitCsvLines = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * EuroMillions CSV from national-lottery.co.uk
 *   header: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Lucky Star 1,Lucky Star 2,UK Millionaire Maker,DrawNumber
 *   row:    24-Apr-2026,25,26,30,40,45,1,5,XXXX0001234,1234
 *
 * Pre-2016-09-24 draws used Lucky Stars 1–11; we drop those so the
 * runtime can assume the modern 1–12 shape (matches GameConfig).
 *
 * Mains and stars are sorted ascending so analysis-side per-position
 * stats are stable regardless of draw-order quirks in the source CSV.
 */
const LUCKY_STARS_12_CUTOFF = "2016-09-24";

const parseEuroMillions = (csvText) => {
  const lines = splitCsvLines(csvText);
  const headerIdx = lines.findIndex(
    (l) =>
      l.includes("DrawDate") &&
      l.includes("Ball 1") &&
      l.includes("Lucky Star 1"),
  );
  if (headerIdx === -1) {
    throw new Error(
      `EuroMillions CSV header not found. First lines: ${lines
        .slice(0, 5)
        .join(" | ")}`,
    );
  }

  const headers = lines[headerIdx].split(",").map((h) => h.trim());
  const cols = [
    "DrawDate",
    "Ball 1",
    "Ball 2",
    "Ball 3",
    "Ball 4",
    "Ball 5",
    "Lucky Star 1",
    "Lucky Star 2",
  ];
  const idx = cols.map((c) => headers.indexOf(c));
  if (idx.some((i) => i === -1)) {
    throw new Error(
      `Missing expected EuroMillions columns. Headers: ${headers.join(", ")}`,
    );
  }

  const dates = [];
  const results = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length < headers.length) continue;
    let date;
    try {
      date = parseDdMmmYyyy(parts[idx[0]]);
    } catch {
      continue;
    }
    if (date < LUCKY_STARS_12_CUTOFF) continue;

    let mains, stars;
    try {
      mains = idx
        .slice(1, 6)
        .map((c) => parseInt(parts[c], 10))
        .sort((a, b) => a - b)
        .map((n) => n.toString().padStart(2, "0"));
      stars = idx
        .slice(6, 8)
        .map((c) => parseInt(parts[c], 10))
        .sort((a, b) => a - b)
        .map((n) => n.toString().padStart(2, "0"));
    } catch {
      continue;
    }
    if (mains.length !== 5 || stars.length !== 2) continue;
    if (mains.some((m) => m === "NaN") || stars.some((s) => s === "NaN")) continue;

    dates.push(date);
    results.push([...mains, ...stars]);
  }

  // The CSV is newest-first; the rest of the app already assumes
  // pastNumbers[0] is the most recent draw, so leave order as-is.
  return { dates, results };
};

export { padNum, parseDdMmmYyyy, splitCsvLines, parseEuroMillions };

/**
 * Per-game fetch sources. Each entry is consumed by `scripts/fetch-data.mjs`
 * which fetches the URL, runs the parser, and writes the resulting JSON to
 * `outFile`. To add a new game: push a new entry here and ship a matching
 * GameConfig under `lib/games/<id>.ts` with `dataPath` pointing at the
 * same file (relative to `public/`).
 */
export const DATA_SOURCES = [
  {
    id: "euromillions",
    url: "https://www.national-lottery.co.uk/results/euromillions/draw-history/csv",
    outFile: "public/data/euromillions.json",
    parser: parseEuroMillions,
  },
];
