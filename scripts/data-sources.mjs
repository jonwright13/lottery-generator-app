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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Parse one lottery.co.uk archive page for any UK game.
 *
 * The pages all follow the same shape — each draw row is anchored by
 *   <a href="/{slug}/results-DD-MM-YYYY" ...>
 * and the row holds N main-ball divs followed by M bonus-ball divs:
 *   <div class="result small {mainClass}">19</div>
 *   <div class="result small {bonusClass}">8</div>
 *
 * `opts.mainCount` / `opts.bonusCount` are validated against each row so a
 * mid-history format change (e.g. an extra ball) shows up as a discarded row
 * rather than silent corruption.
 */
const parseLotteryCoUkPage = (html, opts) => {
  const { slug, mainClass, bonusClass, mainCount, bonusCount } = opts;
  const anchorRe = new RegExp(
    `<a href="/${escapeRe(slug)}/results-(\\d{2})-(\\d{2})-(\\d{4})"`,
    "g",
  );
  const matches = [...html.matchAll(anchorRe)];
  const out = [];

  const mainBallRe = new RegExp(`${escapeRe(mainClass)}">(\\d{1,2})</div>`, "g");
  const bonusBallRe = new RegExp(
    `${escapeRe(bonusClass)}">(\\d{1,2})</div>`,
    "g",
  );

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const [, dd, mm, yyyy] = m;
    const date = `${yyyy}-${mm}-${dd}`;
    const start = m.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const chunk = html.slice(start, end);

    const mains = [...chunk.matchAll(mainBallRe)].map((x) => x[1]);
    const bonuses = [...chunk.matchAll(bonusBallRe)].map((x) => x[1]);

    if (mains.length !== mainCount || bonuses.length !== bonusCount) continue;

    const sortedMains = mains
      .map(Number)
      .sort((a, b) => a - b)
      .map(pad2);
    const sortedBonuses = bonuses
      .map(Number)
      .sort((a, b) => a - b)
      .map(pad2);

    out.push({ date, row: [...sortedMains, ...sortedBonuses] });
  }

  // De-duplicate by date — first occurrence wins.
  const seen = new Set();
  return out.filter((r) => {
    if (seen.has(r.date)) return false;
    seen.add(r.date);
    return true;
  });
};

/**
 * Build an async fetcher that pages through `lottery.co.uk`'s per-year
 * archive for a given game and returns `{ dates, results }` newest-first,
 * filtered to draws on or after `cutoff`.
 *
 *   opts.id          — debug/log label (e.g. "euromillions")
 *   opts.slug        — URL slug ("euromillions", "lotto", ...)
 *   opts.mainClass   — CSS class on the main-ball divs ("euromillions-ball")
 *   opts.bonusClass  — CSS class on the bonus-ball divs ("lotto-bonus-ball")
 *   opts.mainCount   — expected mains per draw
 *   opts.bonusCount  — expected bonuses per draw
 *   opts.startYear   — first year to fetch (anything older is filtered anyway)
 *   opts.cutoff      — ISO date; draws strictly before it are dropped
 *   opts.delayMs     — politeness delay between page requests (default 400)
 */
const makeLotteryCoUkFetcher = (opts) => {
  const {
    id,
    slug,
    mainClass,
    bonusClass,
    mainCount,
    bonusCount,
    startYear,
    cutoff,
    delayMs = 400,
  } = opts;

  return async () => {
    const currentYear = new Date().getUTCFullYear();
    const all = [];

    for (let year = startYear; year <= currentYear; year++) {
      const url = `https://www.lottery.co.uk/${slug}/results/archive-${year}`;
      const html = await fetchHtml(url);
      const rows = parseLotteryCoUkPage(html, {
        slug,
        mainClass,
        bonusClass,
        mainCount,
        bonusCount,
      });
      if (rows.length === 0) {
        if (year < currentYear) {
          throw new Error(
            `[${id}] Parsed 0 draws from ${url}. HTML structure may have changed.`,
          );
        }
        console.warn(`[${id}] No rows yet on ${url}`);
      } else {
        console.log(`[${id}] ${year}: ${rows.length} draws`);
      }
      all.push(...rows);
      if (year < currentYear) await delay(delayMs);
    }

    const filtered = all.filter((r) => r.date >= cutoff);
    filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return {
      dates: filtered.map((r) => r.date),
      results: filtered.map((r) => r.row),
    };
  };
};

/**
 * EuroMillions Lucky Stars went 1–11 → 1–12 on 2016-09-24. The runtime
 * GameConfig models the modern 1–12 shape, so older draws are dropped.
 */
const LUCKY_STARS_12_CUTOFF = "2016-09-24";

/**
 * UK Lotto ball pool went 1–49 → 1–59 on 2015-10-10. The runtime GameConfig
 * models the modern 1–59 shape, so older draws are dropped.
 */
const LOTTO_59_CUTOFF = "2015-10-10";

/**
 * Set For Life launched 18 March 2019; no format changes since.
 */
const SET_FOR_LIFE_LAUNCH = "2019-03-18";

/**
 * Thunderball matrix moved from 5/34 to 5/39 on 10 May 2010. The runtime
 * GameConfig models the modern 1–39 main shape, so older draws are dropped.
 */
const THUNDERBALL_39_CUTOFF = "2010-05-10";

const fetchEuroMillions = makeLotteryCoUkFetcher({
  id: "euromillions",
  slug: "euromillions",
  mainClass: "euromillions-ball",
  bonusClass: "euromillions-lucky-star",
  mainCount: 5,
  bonusCount: 2,
  startYear: 2016,
  cutoff: LUCKY_STARS_12_CUTOFF,
});

const fetchLotto = makeLotteryCoUkFetcher({
  id: "lotto",
  slug: "lotto",
  mainClass: "lotto-ball",
  bonusClass: "lotto-bonus-ball",
  mainCount: 6,
  bonusCount: 1,
  startYear: 2015,
  cutoff: LOTTO_59_CUTOFF,
});

const fetchSetForLife = makeLotteryCoUkFetcher({
  id: "set-for-life",
  slug: "set-for-life",
  mainClass: "setForLife-ball",
  bonusClass: "setForLife-life-ball",
  mainCount: 5,
  bonusCount: 1,
  startYear: 2019,
  cutoff: SET_FOR_LIFE_LAUNCH,
});

const fetchThunderball = makeLotteryCoUkFetcher({
  id: "thunderball",
  slug: "thunderball",
  mainClass: "thunderball-ball",
  bonusClass: "thunderball-thunderball",
  mainCount: 5,
  bonusCount: 1,
  startYear: 2010,
  cutoff: THUNDERBALL_39_CUTOFF,
});

export {
  fetchHtml,
  parseLotteryCoUkPage,
  makeLotteryCoUkFetcher,
  fetchEuroMillions,
  fetchLotto,
  fetchSetForLife,
  fetchThunderball,
  LUCKY_STARS_12_CUTOFF,
  LOTTO_59_CUTOFF,
  SET_FOR_LIFE_LAUNCH,
  THUNDERBALL_39_CUTOFF,
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
  {
    id: "lotto",
    outFile: "public/data/lotto.json",
    source: "https://www.lottery.co.uk/lotto/results/archive-{year}",
    fetch: fetchLotto,
  },
  {
    id: "set-for-life",
    outFile: "public/data/set-for-life.json",
    source: "https://www.lottery.co.uk/set-for-life/results/archive-{year}",
    fetch: fetchSetForLife,
  },
  {
    id: "thunderball",
    outFile: "public/data/thunderball.json",
    source: "https://www.lottery.co.uk/thunderball/results/archive-{year}",
    fetch: fetchThunderball,
  },
];
