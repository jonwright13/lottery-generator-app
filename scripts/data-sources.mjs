/**
 * Per-game data sources.
 *
 * Build-time only. Each entry exposes an async `fetch()` that returns:
 *   { dates: string[], results: string[][] }
 * where dates are ISO YYYY-MM-DD newest-first and each results entry is a
 * flat array of `mainCount + bonusCount` zero-padded 2-digit strings.
 *
 * Letting each source own its fetch lets games that need multi-page scraping
 * (e.g. lottery.co.uk's per-year archive pages) live alongside ones that
 * could read a single CSV later, without forking the runner.
 */

import { setTimeout as delay } from "node:timers/promises";

const UA = "Mozilla/5.0 (compatible; lottery-generator-fetcher/1.0)";

const fetchHtml = async (url) => {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed ${res.status} ${res.statusText}`);
  }
  return res.text();
};

const pad2 = (n) => n.toString().padStart(2, "0");

/**
 * EuroMillions Lucky Stars went 1–11 → 1–12 on 2016-09-24. The runtime
 * GameConfig models the modern 1–12 shape, so older draws are dropped.
 */
const LUCKY_STARS_12_CUTOFF = "2016-09-24";

/**
 * Parse one lottery.co.uk EuroMillions archive page.
 * Each draw row starts with an anchor like
 *   <a href="/euromillions/results-31-12-2024" ...>
 * followed (in the same <tr>) by 5 main-ball divs and 2 lucky-star divs:
 *   <div class="result small euromillions-ball">19</div>
 *   <div class="result small euromillions-lucky-star">8</div>
 * We slice forward from each anchor to the next anchor and pull the divs
 * out of that chunk — robust to whitespace + minor HTML drift.
 */
const parseEuromillionsArchivePage = (html) => {
  const anchorRe = /<a href="\/euromillions\/results-(\d{2})-(\d{2})-(\d{4})"/g;
  const matches = [...html.matchAll(anchorRe)];
  const out = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const [, dd, mm, yyyy] = m;
    const date = `${yyyy}-${mm}-${dd}`;
    const start = m.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const chunk = html.slice(start, end);

    const balls = [...chunk.matchAll(/euromillions-ball">(\d{1,2})<\/div>/g)].map(
      (x) => x[1],
    );
    const stars = [
      ...chunk.matchAll(/euromillions-lucky-star">(\d{1,2})<\/div>/g),
    ].map((x) => x[1]);

    if (balls.length !== 5 || stars.length !== 2) continue;

    const mains = balls
      .map(Number)
      .sort((a, b) => a - b)
      .map(pad2);
    const luckies = stars
      .map(Number)
      .sort((a, b) => a - b)
      .map(pad2);

    out.push({ date, row: [...mains, ...luckies] });
  }

  // De-duplicate by date — the page has the same anchor wrapping the row
  // and individual cells in some layouts; first occurrence wins.
  const seen = new Set();
  return out.filter((r) => {
    if (seen.has(r.date)) return false;
    seen.add(r.date);
    return true;
  });
};

const fetchEuroMillions = async () => {
  const startYear = 2016; // pre-cutoff years are filtered out anyway
  const currentYear = new Date().getUTCFullYear();
  const all = [];

  for (let year = startYear; year <= currentYear; year++) {
    const url = `https://www.lottery.co.uk/euromillions/results/archive-${year}`;
    const html = await fetchHtml(url);
    const rows = parseEuromillionsArchivePage(html);
    if (rows.length === 0) {
      // A young current year (e.g. fetched on Jan 2nd) might have very few
      // rows but should never be totally empty for past years.
      if (year < currentYear) {
        throw new Error(
          `[euromillions] Parsed 0 draws from ${url}. HTML structure may have changed.`,
        );
      }
      console.warn(`[euromillions] No rows yet on ${url}`);
    } else {
      console.log(`[euromillions] ${year}: ${rows.length} draws`);
    }
    all.push(...rows);
    if (year < currentYear) await delay(400);
  }

  const filtered = all.filter((r) => r.date >= LUCKY_STARS_12_CUTOFF);
  filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    dates: filtered.map((r) => r.date),
    results: filtered.map((r) => r.row),
  };
};

export {
  fetchHtml,
  parseEuromillionsArchivePage,
  fetchEuroMillions,
  LUCKY_STARS_12_CUTOFF,
};

/**
 * Per-game fetch sources. Each entry is consumed by `scripts/fetch-data.mjs`
 * which calls `fetch()` and writes the resulting JSON to `outFile`. To add a
 * new game: push a new entry here and ship a matching GameConfig under
 * `lib/games/<id>.ts` with `dataPath` pointing at the same file (relative to
 * `public/`).
 */
export const DATA_SOURCES = [
  {
    id: "euromillions",
    outFile: "public/data/euromillions.json",
    source: "https://www.lottery.co.uk/euromillions/results/archive-{year}",
    fetch: fetchEuroMillions,
  },
];
