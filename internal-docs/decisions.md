# Architecture Decisions

## ADR-001: Tooltip primitive — `@radix-ui/react-tooltip` shadcn wrapper

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
Per-number scores and icon-button affordances on the home page were using the
native `title` attribute. `title` is slow to appear, unstyled, ignored on touch
devices, and inconsistent with the rest of the app (which uses Radix-backed
shadcn primitives such as `Popover` and `DropdownMenu`).

**Decision:**
Add `@radix-ui/react-tooltip` and a thin shadcn-style wrapper at
`components/ui/tooltip.tsx`. The wrapper instantiates `TooltipProvider` per
`Tooltip` so consumers don't need to thread a provider into the tree (matches
the modern shadcn pattern).

**Rationale:**
- Stays inside the existing shadcn / Radix ecosystem already used for accordion,
  popover, dropdown, slot, label.
- Native `title` cannot be styled, doesn't show on touch, and produces
  inconsistent visuals next to the rest of the design system.
- Existing `Popover` is click-driven and not appropriate for hover/focus
  surfacing of supplemental info.

**Consequences:**
- One new runtime dep (`@radix-ui/react-tooltip`).
- Slight per-tooltip overhead since each `Tooltip` mounts its own provider —
  acceptable here, can be hoisted to a single `TooltipProvider` in
  `Providers` later if needed.

---

## ADR-002: Split historical analytics into a dedicated `/analysis` page

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
Until now the home page mixed two concerns: the generator (its card, controls,
and per-result match list) and the historical heatmap. As we plan to expand
historical analytics (sum distribution, odd/even, top-numbers-per-position,
and eventually a window filter for "full / 5y / 1y" subsets), keeping that
content on the home page would crowd the generator above the fold and force
us to either truncate or hide-behind-toggles content that users come for.

**Decision:**
Introduce a new `/analysis` route that owns all historical analytics. The
heatmap moves out of `app/page.tsx` to `app/analysis/page.tsx`, joined by
`SumDistribution`, `OddEvenDistribution`, and `TopNumbersPerPosition`
components. The home page stays focused on Generate (generator card +
per-result `MatchResults` + controls).

**Rationale:**
- Lets the generator be the unambiguous primary action on `/`.
- Gives historical analysis room to grow (window filter, more charts) without
  pushing the generator below the fold.
- Reuses what `ThresholdCriteria` already computes (`distribution`,
  `positionCounters`, `sumMin/sumMax`). Sum bucketing is computed inline on
  the page from `pastNumbers` rather than added to the class — the generator
  doesn't need it, and ~3.5k draws is trivial to bucket once at mount time.

**Consequences:**
- New top-level route + nav link; bumps `app/`'s route surface from 4 to 5.
- `MatchResults` is now rendered inside `GeneratorContainer` (below the result
  card) on the home page in addition to its existing use on `/check-numbers`.
- Future window-filter work has a natural home; will likely move sum
  bucketing onto `ThresholdCriteria` (or a parallel class) when the filter
  re-instantiates analysis from a sliced `pastNumbers`.

---

## ADR-003: Historical window filter via per-window `ThresholdCriteria`

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
We need `/analysis` to be filterable by a historical window ("All time",
"Last 5 years", "Last year"). The data layer's analytics
(`ThresholdCriteria`) is already constructed once at module scope inside
`useDataProvider.tsx` from the *full* `pastNumbers`, and that instance also
seeds the generator's defaults (`sumMin/sumMax`, `oddRange`, gap thresholds,
multiples caps). We need to introduce windowing without disturbing those
generator defaults.

**Decision:**
Keep the full-history `ThresholdCriteria` exactly where it is in
`DataProvider`, and have `/analysis` instantiate a *fresh*
`ThresholdCriteria` from the sliced `pastNumbers` whenever the window
changes. The slice and the new instance are computed inside a single
`useMemo` keyed on the window choice. The chosen window lives in a `?window=`
URL search param so the selection is shareable and refresh-stable. Filter
state is local to the analysis page only — `DataProvider` never sees it.

The three components whose copy referenced "the generator's defaults"
(`SumDistribution`, `OddEvenDistribution`, `GapDistribution`) have their
text reworded to be window-neutral so the same component renders correctly
under both full-history and windowed analyses.

**Rationale:**
- `ThresholdCriteria` is cheap (~3.5k draws, sub-millisecond) and pure, so
  re-instantiating it per window is fine; no need to refactor the class to
  support partial recomputation.
- Keeping the generator's defaults rooted in full history is correct — a
  user looking at "last year" on `/analysis` should not silently shift
  what numbers the generator targets.
- URL search param matches the rest of the app's "client-only,
  context-driven" model; no extra global state is introduced.
- `useSearchParams()` requires a Suspense boundary in Next.js 16, so the
  page wraps its inner content in `<Suspense fallback={null}>`. The
  fallback is null because the page is already mounted client-side via
  `DataProvider`; there's nothing to skeleton.

**Consequences:**
- Per-window `new ThresholdCriteria(slice)` runs on each window switch.
  Acceptable today; if it ever becomes hot we can memoise per-window-key
  across renders rather than per-render.
- The windowed analysis derives its own `sumMin/sumMax`, `oddRange`, and
  gap thresholds from the slice — the highlighted bands on `/analysis`
  shift with the window. Components no longer claim those bands match the
  generator's settings; copy is now phrased neutrally.
- Custom date-range and "last 6 months" / "last 10 years" presets are out
  of scope for this iteration; can be added by extending `WINDOW_OPTIONS`
  and (for custom range) replacing the cutoff calc with a date picker.

---

## ADR-004: Decade-band distribution analysis card uses fixed `DEFAULT_OPTIONS` cap, not live `genOptions`

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
Adding a `/analysis` card to surface what the existing `clusterMax` /
`clusterGroupSize` rule does historically. Three places hold cluster
settings: `DEFAULT_OPTIONS` (constants), `genOptions` (live, user-tunable
on the home page), and `ThresholdCriteria` (which currently does **not**
compute or expose any cluster info — `clusterMax` is the one constraint
not seeded from history). The card needs a "cap" line to mark which
max-fill values are "in" vs "out", so we have to pick a source.

**Decision:**
The new `ClusterDistribution` component reads `clusterMax`, `clusterGroupSize`,
and `maxMain` directly from `DEFAULT_OPTIONS` (constants), matching the
generator's seeded defaults. It does **not** pull from `genOptions` and
does **not** re-derive a cap from the windowed `pastNumbers`. The card
lives outside the `DataProvider` consumer chain for these specifics —
only `pastNumbers` is passed in as a prop.

**Rationale:**
- Other windowed analysis cards (sum, odd-even, gap) re-derive their bands
  from the windowed `ThresholdCriteria`. Cluster has no equivalent
  derivation in `ThresholdCriteria`, so the closest analog is the static
  default — and the static default is what every freshly mounted session
  sees as the cluster cap.
- Pulling from `genOptions` would make the highlighted cap shift if a user
  tweaked the home-page Controls, even though the analysis page is
  meant to be window-/full-history focused, not session-state focused.
- Adding cluster derivation to `ThresholdCriteria` (e.g. 95th-percentile
  max-band-fill) is a defensible future move — but that would also force
  a decision on whether to seed `genOptions.clusterMax` from history,
  which changes generator behaviour. Out of scope for this card.

**Consequences:**
- The "Within cap (≤ N)" stat in the card always reflects the default cap,
  not whatever the user has tuned. If we later want it to track
  `genOptions`, we wire `useData()` into the component and re-render on
  control changes — small change, deferred for now.
- `ClusterDistribution` is the only analysis card that imports from
  `lib/generator` for constants rather than for the `ThresholdCriteria`
  type. Acceptable; the import is a stable narrow surface.

---

## ADR-005: Last-digit spread modelled as a 95th-percentile cap on max same-last-digit per draw

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
Adding the next statistical-fit constraint after exhausting decade
coverage (which already existed). Several encodings were considered for
"last-digit spread": (a) reject any set with two numbers sharing a last
digit; (b) cap the *count* of repeated last digits per draw (e.g. ≤2
pairs); (c) cap the largest same-last-digit *group* per draw; (d) score
sets by how many distinct last digits they cover.

**Decision:**
Use a single integer cap, `maxSameLastDigit`, on the largest count of
mains sharing any last digit within a draw (option c). Default seeded
from history as the 95th-percentile of that per-draw max, mirroring how
gap thresholds and multiples caps are derived. Default fallback in
`DEFAULT_OPTIONS` is 3.

**Rationale:**
- Same shape as the existing `clusterMax` and per-base
  `maxMultiplesAllowed` rules: one int per option, 95th-percentile
  derivation, single check in `mainRules`. Keeps the codebase coherent.
- Option (a) is too aggressive: with 5 mains across 50 numbers, last-digit
  collisions happen often enough that hard "no repeats" would reject the
  vast majority of historical draws.
- Options (b) and (d) require a richer state per draw and harder
  defaults to derive — diminishing returns versus (c).
- The "max group" framing matches how the user mentally reasons about
  it ("4+ ending in 7 is unusual") and is what the analysis card
  displays.

**Consequences:**
- Adds one new rejection-reason key (`last_digit_repeat`) and one new
  numeric option. Both are now part of the public type surface.
- The home-page `GeneratorControls` does **not** yet expose this option.
  Seeded value from history is used until/unless we add an accordion
  item. Acceptable: most users won't tune it.
- Last-digit *coverage* (how many distinct digits are present) is not
  enforced — could be a future complementary scoring nudge.

---

## ADR-006: `RuleOptions` extends `Pick<>` with a runtime data field for previous-draw overlap

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
The previous-draw-overlap rule needs the immediately prior draw's main
numbers at evaluation time. Up until now, `RuleOptions` was a pure
`Pick<GenerateValidNumberSetOptions, ...>` — every value originated as a
user-tunable config field. The previous draw is *data*, not config: it
comes from `lotteryNumbers[0]` inside `generateValidNumberSet`, not from
the user.

Three options were considered:
1. Add `previousDrawMain` to `GenerateValidNumberSetOptions` and Pick it
   like everything else.
2. Pass `previousDrawMain` as a separate parameter to `evaluateRules`
   alongside `RuleOptions`.
3. Extend `RuleOptions` from a pure `Pick<>` to an intersection that
   includes a runtime data field.

**Decision:**
Option 3. `RuleOptions` is now `Pick<GenerateValidNumberSetOptions, ...> &
{ previousDrawMain: number[] }`. The data field is set in
`generateValidNumberSet` and threaded through unchanged.

**Rationale:**
- Option 1 muddies the public option surface — `previousDrawMain` should
  not be tunable from `GeneratorControls`, and adding a non-control
  numeric field would invite confusion.
- Option 2 fragments the rule signature: every rule would need to accept
  a separate context arg even though most rules don't use it. Bad
  ergonomics for the 7 existing rules that don't care.
- Option 3 keeps the `(nums, opts) => reason | null` rule shape uniform
  while letting individual rules read runtime data when they need it.

**Consequences:**
- `RuleOptions` is now slightly less symmetric — most fields trace to
  `DEFAULT_OPTIONS`, one is purely runtime. Documented inline.
- Future rules that need other runtime context (e.g. recent-draw windows,
  user-selected favourites) can extend the intersection without churn.
- The empty-array case (`previousDrawMain: []`) is the no-op signal —
  the rule short-circuits when there's no history. Tested via the
  `lotteryNumbers[0]?` optional chain in `generateValidNumberSet`.

---

## ADR-007: Pair co-occurrence as a soft scoring blend, not a hard reject

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
We wanted to reflect pair co-occurrence statistics in the generator. The
existing constraints are mostly hard rejects (sum range, gap thresholds,
multiples caps, etc.). For 5 mains drawn from 1–50 the expected count
per pair is ~24/3000 — close enough that hard-rejecting any pair below
some percentile would prune large swathes of legitimate sets. Three
options were considered:

1. Hard reject sets whose pair-cohesion falls below a percentile.
2. Replace the existing positional score with a pair score.
3. Blend a pair-cohesion score into the optimisation target with a
   user-tunable weight (default 0).

**Decision:**
Option 3. New `pairScoreWeight: number` (0..1) blends pair-cohesion
into the score the generator optimises and uses to early-return. The
positional score (`bestScore`) and pair score (`bestPairScore`) are
still reported separately so the UI can show them.

**Rationale:**
- Option 1 is too aggressive given the small signal-to-noise on
  per-pair counts and risks making the generator slow or unable to
  find a set.
- Option 2 changes existing user-visible semantics — `minScore` and
  the displayed "Avg. positional frequency" would silently mean
  something different.
- Option 3 preserves prior behaviour at weight = 0 (which is the
  default) while letting the user dial in pair-cohesion bias.

**Consequences:**
- `minScore` checks the blended score, not the raw positional score.
  When `pairScoreWeight = 0` they coincide, so the existing slider
  semantics are preserved. Documented in the accordion copy.
- Result type and worker contract gained `bestPairScore`. Worker now
  takes a 4th `pairCounts` argument; precomputed from
  `analysis.pairCoOccurrenceData.pairCounts` on the home page.
- Future scoring tweaks (e.g. recency bias) can layer onto the same
  blend pattern without redefining `bestScore`.

---

## ADR-008: Hot/cold recent-frequency as a separate blend layer

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
"Hot/cold" biasing (favouring numbers that have been hot in the last N
draws) needs to influence the generator without breaking the existing
`bestScore` semantics or duplicating logic with the pair-score blend
introduced in ADR-007. Two natural shapes:

1. Multiply the existing positional score by a recency factor.
2. Compute a separate `recentScore` from a positional counter built
   from `lotteryNumbers.slice(0, recentWindowSize)`, then blend with
   the all-time positional score using `recentBias` before the pair
   blend layer applies.

**Decision:**
Option 2. The generator now computes:
```
positionBlended = (1 - recentBias) * allTimeScore + recentBias * recentScore
combinedScore   = (1 - pairScoreWeight) * positionBlended + pairScoreWeight * pairScore
```
`recentBias = 0` collapses to the all-time score; `pairScoreWeight = 0`
collapses to the existing pair-free behaviour. Default both = 0.

**Rationale:**
- A single multiplicative recency factor is hard to interpret and
  doesn't compose cleanly with the pair blend.
- Two-layer linear blend is the same shape as ADR-007. Each layer has
  one knob and a 0-default that turns it off, so each can be reasoned
  about independently.
- Computing `recentPositionCounters` inside the generator (instead of
  threading another precomputed param) keeps the worker contract small
  — recent counters are cheap (≤ a few hundred draws) and
  rebuild-as-needed correctness is more valuable than caching.

**Consequences:**
- The result type gains `bestRecentScore` (only meaningful when bias is
  on). The footer in `GeneratorContainer` only renders that line when
  the score is non-zero so it doesn't add noise at default settings.
- `bestScore` continues to mean *all-time* positional frequency. UI
  copy in the accordion explains that the bias affects which set is
  chosen first, not which sets are valid.
- The hot/cold analysis card on `/analysis` uses its own internal
  window-size state (default 50). The generator's `recentWindowSize`
  knob lives in `GeneratorControls` and is independent of the card —
  matching the user's intent that the two views are separate.

---

## ADR-009: Game abstraction (`GameConfig`) + variable-length `LotteryTuple`

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
The app was hard-wired to a single 5/50 + 2/11 game (the Merseyworld
synthetic feed). The plan is to add EuroMillions (5/50 + 2/12), Lotto
(6/59 + 1), Set For Life (5/47 + 1/10), and Thunderball (5/39 + 1/14),
all driven from a top-level game switcher with EuroMillions as the
default. Three things had to be unwound to make that possible:

1. The fixed 7-string `LotteryTuple` shape (a literal `[s,s,s,s,s,s,s]`
   tuple type) baked into `lib/generator/types.ts`.
2. The `MAIN_COUNT = 5` / `MAIN_MAX = 50` / `LUCKY_MAX = 11` constants
   sprinkled across ~15 component files.
3. The `FIELDS` constant in `constants.ts` enumerating exactly 5 mains
   + 2 luckies for the Check Numbers form / heatmap / historical table
   / top-numbers card, plus tier-matching code in `lib/lottery-match.ts`
   keyed off the same 5+2 shape.

The shape question split into two design calls:

(a) **Per-draw representation**: keep one flat `string[]` per draw
    (`[...mains, ...bonuses]`) vs split into `{ main, bonus }`.
(b) **Where game shape lives at runtime**: a global registry imported
    everywhere vs context exposed via `useData()`.

**Decision:**
Introduce `lib/games/` exporting a `GameConfig` interface with `main`/
`bonus` `BallSet`s (count, min, max, label), `dataPath`, and ordered
`prizeTiers`. Register the existing synthetic feed as the lone
`MERSEYWORLD_SYNTHETIC` game and surface it via `useDataProvider`'s
`useData()` hook as `{ game, fields, ... }`. `LotteryTuple` becomes a
flat variable-length `string[]`. `ThresholdCriteria`'s constructor
takes `(lotteryNumbers, game, debug)` and threads game counts/maxes
through every analyser. `generatePatternProbabilities` derives its
pattern list from `(mainCount, bonusCount)` rather than a hard-coded
12-row table. `countMatchesByTier` accepts a `game` arg and uses
`game.prizeTiers` for ordering.

**Rationale:**
- (a) Flat: every existing consumer that already does
  `draw.slice(0, MAIN_COUNT)` keeps working — the diff becomes
  "replace `MAIN_COUNT` with `game.main.count`" rather than restructuring
  every render. The historical-duplicate `Set` lookup
  (`draw.join(",")`) and the heatmap's per-position keying both keep
  working unchanged. Splitting into `{ main, bonus }` would have been
  cleaner conceptually but tripled the blast radius.
- (b) Context: route-level game switching (next branch) reads the
  active game from a URL/state-driven source. Pinning the active game
  to context means the switcher only has to update one place rather
  than re-import per-component. Components that previously imported
  `FIELDS` from `constants.ts` now read `fields` from `useData()`,
  computed via `buildFieldsForGame(game)` in `constants.ts`.
- `getTopNumbersHistorical` previously asserted `length === 7`; it
  now compares against `game.main.count + game.bonus.count` so the
  invariant is per-game.
- The pattern-probabilities filter was tuned to reproduce the
  original 12-entry list for (5,2) exactly — the test expectation
  remained byte-for-byte unchanged. For other shapes (5,1) etc. the
  same descending-significance family is generated.

**Consequences:**
- `LotteryTuple` no longer carries a length proof at the type level —
  consumers that need positional access slice using game counts.
  Acceptable: the flat shape is enforced at the data-loader boundary
  and never written ad-hoc by UI code.
- `useData()` is the single source of truth for game shape. Any new
  per-game UI (game switcher, per-game prize labels) plugs in there.
- The on-disk `external-data.json` shape was *not* touched in this
  branch — it still stores 7-string flat arrays. The data-migration
  branch (next) generalises the loader to per-game JSON files.
- `hooks/use-saved-numbers.ts` no longer enforces `length === 7` so a
  saved set is just `string[]`. There is no per-set `gameId` yet;
  saved sets remain global. This is fine while there's only one game;
  the switcher branch will add `gameId` to `SavedSet` and migrate
  v1 entries.
- All analysis-page components were touched but each behaves
  identically for the only registered game today. Visible copy was
  reworded in a few places to drop the "5 main / 2 lucky" literals
  and reference `mainCount`/`bonusLabel` from context.
- The threshold-criteria methods that used to take `(lotteryNumbers,
  mainOnly = true)` now take `(lotteryNumbers, mainCount)` directly.
  External callers re-instantiate the class via `new
  ThresholdCriteria(...)` rather than calling these helpers
  individually, so the change is internal.

---

## ADR-010: Per-game data fetcher + EuroMillions as first real game

**Date:** 2026-04-27
**Status:** Accepted

**Context:**
The Merseyworld synthetic CSV (`?Machine=Z&Ballset=0`) is not a real
UK National Lottery game; it was a stand-in while the app's
single-game architecture was generalised in ADR-009. The next step is
loading real data from `national-lottery.co.uk`'s per-game CSV
downloads, starting with the eventual default game (EuroMillions).
Three things had to be settled:

1. **Where the per-game URL + CSV parser lives.** Options: alongside
   the TS `GameConfig` in `lib/games/<id>.ts` (single source of
   truth, but requires the fetch script to import TS — adds tsx /
   ts-node infra), or as a parallel registry in plain ESM JS owned by
   the script (small id duplication, no new build infra).
2. **Per-game JSON file shape.** Options: keep the existing flat
   `{ fetchedAt, source, dates, results: string[][] }` shape (same
   as the retired `external-data.json`) or split into typed
   `{ main: string[][], bonus: string[][] }` arrays.
3. **EuroMillions Lucky Stars 1–11 → 1–12 cutoff (Sep 24, 2016).**
   The CSV includes draws from 2004 onward but the 1–12 era only
   started 2016-09-24. Either filter at parse time or include
   variable-shape draws and conditionally handle them at runtime.

**Decision:**
1. Per-game URL + parser lives in `scripts/data-sources.mjs` (plain
   ESM JS). The TS `GameConfig` in `lib/games/<id>.ts` only carries
   the runtime contract (counts, ranges, prize tiers, dataPath). The
   `id` field is duplicated across the TS config and the JS source —
   acceptable.
2. Keep the flat shape (`{ fetchedAt, source, dates, results }` with
   variable-length per-row results). It composes with the
   `LotteryTuple = string[]` decision from ADR-009 — every consumer
   already slices by `game.main.count`, so no consumer changes
   needed when a game has 6 mains (Lotto) or 1 bonus (SFL,
   Thunderball).
3. Filter at parse time — the EuroMillions parser drops any draw
   with `date < "2016-09-24"`. The runtime can then assume the
   modern 1–12 stars shape unconditionally.

The existing Merseyworld synthetic feed is fully retired:
`lib/games/merseyworld-synthetic.ts` and
`public/data/external-data.json` are deleted. EuroMillions
(`EUROMILLIONS`) is now the sole registered game and the default.

**Rationale:**
- (1) JS-side registry avoids adding `tsx` / `ts-node` and keeps the
  CI workflow simple (`node scripts/fetch-data.mjs`). The cost — one
  duplicated string per game — is trivially auditable. If the script
  ever needs the rest of the GameConfig (counts, ranges) we can
  promote it to TS later; for now it only needs URL + parser.
- (2) The flat shape was already validated end-to-end in ADR-009.
  Splitting `main` / `bonus` would have forced a second consumer
  refactor for zero downstream benefit at this stage.
- (3) Filtering at parse time means the runtime never has to think
  about historical format changes. Each game owns its own
  "current-format start date" inside its parser, so adding Lotto
  (49→59 ball change in Oct 2015) follows the same pattern.
- The fetch script gained an optional `--game <id>` flag so a single
  game can be re-fetched in isolation during development. The
  daily-cron production usage is unchanged (no flag = all games).
- The bootstrap `euromillions.json` is committed with 207 real
  draws (2024 + 2025 from `lottery.co.uk`'s per-year archive,
  scraped because `national-lottery.co.uk` blocks this development
  sandbox). This guarantees the app renders coherent analyses
  immediately on a fresh clone. The next `npm run fetch:data` (or
  the daily cron) will replace it with the full post-2016-09-24
  history (~950+ draws) without any code change.

**Consequences:**
- The data file *shape* has not changed — the only diff vs branch 1
  is that `results` rows now contain real EuroMillions draws and
  per-row length is still 5+2=7 (same as the synthetic was). When
  Lotto / SFL / Thunderball land, the per-row length will vary per
  game — acceptable since each game has its own JSON file.
- The per-row `results` shape is no longer a typed contract: the
  data file stores `string[][]` with variable length, validated at
  parse time. Bad data (wrong length, out-of-range numbers) would
  surface as a `getTopNumbersHistorical` length-mismatch error at
  app boot rather than a silent miscount.
- `lib/lottery-match.test.ts` previously imported the synthetic game
  for its prize-tier expectations. With the synthetic retired, the
  test now defines its own minimal 5/50 + 2/11 GameConfig inline so
  the canonical 9-tier ordering test stays byte-for-byte stable
  regardless of which real games are registered.
- `.github/workflows/fetch-data.yml` now `git add public/data` (the
  whole directory) instead of the specific
  `external-data.json`. Future games drop in without touching the
  workflow.
- The CSV parser's hash-skip-write logic now compares on
  `{ dates, results }` only (excluding `fetchedAt`). Previously the
  whole payload was hashed, but `fetchedAt` always changes, so the
  old behaviour was almost-always-write. Net effect: fewer empty
  commits on quiet days (e.g. weekends with no draw).

---

## ADR-011: Switch EuroMillions data source from national-lottery.co.uk CSV to lottery.co.uk archive scrape

**Date:** 2026-04-28
**Status:** Accepted (supersedes the URL choice in ADR-010, contract still applies)

**Context:**
ADR-010 wired the fetch script to `https://www.national-lottery.co.uk/results/euromillions/draw-history/csv`. On first production run, that endpoint returned XML for *only the latest draw* (`<is-latest-draw>Y</is-latest-draw>`) — the bulk-history CSV path appears to have been killed or repurposed. The `/draw-history/xml` sibling URL also rejects automated `User-Agent`s with HTTP 403. With no replacement bulk endpoint exposed by the official site, the fetcher had to come from somewhere else.

`lottery.co.uk` exposes per-year archive pages (`/euromillions/results/archive-{year}`) that go back to 2004 — far more history than national-lottery.co.uk ever offered. The `<a href="/euromillions/results-DD-MM-YYYY">` anchors plus the `euromillions-ball` / `euromillions-lucky-star` div classes make the page mechanically parseable.

**Decision:**
Replace the single-URL CSV fetch with a per-year HTML scrape of `lottery.co.uk` for EuroMillions. Refactor the per-game source contract from `{ url, parser }` to `{ source, fetch: async () => ({ dates, results }) }` so each game owns its retrieval strategy (single URL today, multi-page tomorrow). Apply a 400 ms inter-page delay to be polite. Filter to `>= 2016-09-24` to keep the runtime GameConfig (`bonus.max = 12`) consistent.

**Rationale:**
- The official endpoint is gone; we need to ship.
- The new contract collapses two responsibilities (fetching + parsing) per source into one closure, removing the awkward `parser(text)` indirection that only made sense when every source was a single URL with a CSV body.
- HTML scraping is brittler than CSV, but the failure mode is loud (`Parsed 0 draws from <url>` aborts the run), which the daily cron will surface as a failed job rather than a silent stale-data drift.
- A start year of 2016 captures everything we keep after the cutoff filter without paying for fetches we will throw away.

**Consequences:**
- The `parser(text)` API and helpers (`padNum`, `parseDdMmmYyyy`, `splitCsvLines`) are gone. Future games (Lotto, SFL, Thunderball) will each write their own `fetch()` against `lottery.co.uk` rather than reusing a shared CSV parser.
- Each `npm run fetch:data` issues ~10 HTTP requests (one per archive year) plus the inter-page delay; expect the CI step to take ~5 s instead of <1 s. Acceptable on a daily cron.
- The post-2016-09-24 data set is now ~1000 draws — roughly 5x what national-lottery.co.uk would have served — which materially improves all the historical-distribution analyses (`ThresholdCriteria` percentiles, position counters, pair co-occurrence).
- We are now a polite consumer of `lottery.co.uk`. If they break the HTML or block the User-Agent, the cron job will fail loudly. ADR-012 (or sooner) might revisit this if the National Lottery publishes a stable bulk endpoint again.

---

## ADR-012: Multi-game runtime via `?game=` URL param + statically imported per-game JSONs

**Date:** 2026-04-28
**Status:** Accepted

**Context:**
The app was structured around a single registered game (post-ADR-009 plumbing) but only one was wired into the runtime. Branch 3 of the multi-game roll-out registers Lotto alongside EuroMillions and exposes a top-of-page game switcher. The runtime needed a way to (a) carry the active game through SPA navigation, (b) reseed `genOptions` when the user switches, and (c) keep the per-page bundle small enough that adding more games later is not a death-by-a-thousand-imports situation.

**Decision:**
- The active game lives in the URL as `?game=<id>` (omitted when it equals `DEFAULT_GAME_ID`). `useSearchParams` in `DataProvider` reads it on every render; `<Suspense fallback={null}>` is wrapped around `DataProvider` in `Providers` so the SSR/SSG path is satisfied.
- Each game's JSON is `import`-ed at module scope and registered in a `RAW_DATA: Record<gameId, RawGameData>` map. Lookup is O(1) by id; the bundler tree-shakes nothing because every game's JSON ends up in the client bundle either way today.
- Switching games re-runs the per-game `useMemo` (analysis, fields, seeded options) and re-seeds `genOptions` via the React-blessed "previous-render-id" pattern: a separate `useState(prevGameId)` compared against `game.id` during render, with `setGenOptions(seededOptions)` called when they diverge. The lint rule `react-hooks/refs` rejects the equivalent `useRef` form so the `useState` form is preferred.
- The Navbar `<GameSwitcher />` is a `DropdownMenu` + `DropdownMenuRadioGroup` listing every entry in `GAMES`, with `router.replace(...)` (not `push`) so back-button history doesn't accumulate one entry per game switch. All other Navbar / NavItems hrefs are filtered through `useGameAwareHref()` so cross-page navigation preserves the active game.

**Rationale:**
- URL-as-source-of-truth means the active game is shareable, deep-linkable, bookmarkable, and survives a refresh — none of which `localStorage` would give for free.
- Static imports keep the architecture simple: no `loading` UI, no client-side fetch waterfall on first paint, no race between data arrival and analysis. The cost (~120 KB JSON per game in the bundle) is acceptable up to ~5 games; past that, switch to dynamic imports + a `<Suspense>` per game.
- The "previous-render-id" reseed pattern is in the React docs explicitly as the way to derive state from props without an effect. It avoids the flicker of effect-driven reseeding (which would render once with stale options) and the complexity of a `key`-on-DataProvider remount strategy.
- `router.replace` over `router.push` matches user mental model: switching games is a view change, not a navigation event you would want to undo with the back button. Same reason `scroll: false` is set.

**Consequences:**
- Every page becomes effectively dynamic at the route level because `useSearchParams` opts the route into Suspense-bailout. The previous all-static prerender still works because the Suspense fallback is `null` and the build succeeds without errors; pages render after hydration. If we ever want to ship statically-prerendered HTML keyed on game (`/euromillions`, `/lotto`, ...), this design has to change.
- Adding a game is now: (1) ship `lib/games/<id>.ts` GameConfig, (2) add to `GAMES` in `lib/games/index.ts`, (3) add a `DATA_SOURCES` entry in `scripts/data-sources.mjs`, (4) `import` the JSON in `useDataProvider.tsx` and add to `RAW_DATA`. Step 4 is the one that scales linearly; everything else is one-line.
- The home page `app/page.tsx` previously hardcoded `MAIN_COUNT = 5`. Fixed in this branch to derive from `game.main.count` so the slice between `userMain` / `userLucky` is correct for Lotto's 6-main shape. Other consumers were already parameterized.

---

## ADR-013: Add Set For Life as third registered game

**Date:** 2026-04-28
**Status:** Accepted

**Context:**
With ADR-012 in place, adding a real game becomes mostly mechanical: ship a GameConfig, register it, point the fetcher at the right slug, import the JSON. Set For Life launched 18 March 2019 with a stable 5/47 + 1/10 format and is the natural third entry after EuroMillions and Lotto.

**Decision:**
- Model the Life Ball as `bonus.count = 1, bonus.max = 10` — a separate ball pool from the mains, which is exactly how Set For Life works (the Life Ball machine is independent of the main ball machine).
- Use 9 prize tiers in descending official prize value: `[5,1],[5,0],[4,1],[4,0],[3,1],[3,0],[2,1],[2,0],[1,1]`. The `1+Life` tier wins a free Lucky Dip rather than cash, but it is still an official match category and matches the modeling choice already made for Lotto's Match-2.
- Cutoff is the launch date (2019-03-18) since there have been no format changes; the fetch script still applies the cutoff so a future format change would slot in cleanly.

**Consequences:**
- Bundle now contains three games' worth of historical JSON. Total static-import cost ~360 KB. Still inside the budget I called out in ADR-012 (revisit at 5+ games). Thunderball will push it to ~480 KB; that is the trigger for considering dynamic imports if it lands soon after.
- The `RAW_DATA` map key uses the kebab-cased game id (`"set-for-life"`) verbatim so that `?game=set-for-life` URL params line up with the lookup. No camelCase / kebab translation needed in either direction.

---

## ADR-014: Add Thunderball as fourth registered game; defer dynamic-import decision

**Date:** 2026-04-28
**Status:** Accepted

**Context:**
Thunderball is the fourth and final game in the multi-game roll-out. Two things make it a touch unusual versus the others: (a) it has the `[0, 1]` prize tier (matching just the Thunderball with zero mains correct wins £3) which no other registered game has, and (b) it draws four times per week (Tue/Wed/Fri/Sat), so its history file is materially larger than the others — 2929 rows vs ~750-1100 for the others.

ADR-012 set a soft threshold: "Static imports keep the architecture simple ... up to ~5 games; past that, switch to dynamic imports." We are now at 4 games totalling ~615 KB of JSON in the client bundle, with Thunderball alone responsible for ~300 KB.

**Decision:**
- Register Thunderball with `prizeTiers: [[5,1],[5,0],[4,1],[4,0],[3,1],[3,0],[2,1],[1,1],[0,1]]`. The `[0, 1]` tier requires no special handling because `countMatchesByTier` already keys lookups on `(mainHits, bonusHits)` pairs — it just emerges as another row in the table.
- **Defer** the static-imports → dynamic-imports refactor. We are at 4 games, not 5+, so the threshold has not been crossed; and the work to swap to dynamic imports adds a `<Suspense>` boundary per consumer plus a loading state across analysis/historical/check-numbers pages — non-trivial. Note in the progress log that the next round of work should consider it.
- Use `2010-05-10` as the cutoff (the 5/34 → 5/39 matrix change). The earliest draw the parser actually returns post-filter is `2010-05-12`, suggesting either lottery.co.uk has no entry for `2010-05-10` itself or the format change started a few days later than the conventional citation; either way the filter does its job (max main observed = 39 across all 2929 rows, confirming no 5/34-era draws bled through).

**Rationale:**
- The `[0, 1]` tier is a useful regression test for the data model: it confirms the `(mainHits, bonusHits)` keying generalises beyond the games where the bonus is "supplementary" and into games where it is itself a prize-bearing dimension.
- Deferring the dynamic-import refactor keeps this branch focused. With 4 games we have not yet hit the pain point the soft threshold was meant to flag, and the right time to do the refactor is when the bundle-size cost shows up in real performance metrics, not pre-emptively.

**Consequences:**
- Multi-game roll-out is now complete (EuroMillions, Lotto, Set For Life, Thunderball). Hot Picks remains explicitly out of scope per the original product decision.
- Bundle is ~615 KB heavier than the single-game baseline. This is gzipped down to ~120 KB on the wire (rough estimate, JSON of zero-padded short strings compresses well) so the actual user-facing cost is smaller than the on-disk number suggests, but it is still on the static path and will be visible on cold loads.
- Adding a sixth game (or replacing Thunderball with a similarly-large dataset) crosses the soft threshold; revisit then.

---

## ADR-015: Tag saved sets with their game id; one-shot v1 → v2 localStorage migration

**Date:** 2026-04-28
**Status:** Accepted

**Context:**
The multi-game roll-out left one piece of state un-namespaced: the `saved-numbers-v1` localStorage list. A user with EuroMillions saved sets who switched to Lotto would see those sets appear in the Lotto Check Numbers page even though the numbers were drawn against a 5/50 + 2/12 grid, not 6/59 + 1/59 — a confusing footgun. The "Drawn before" badge would also light up against the wrong historical archive.

**Decision:**
- Add a `game: string` field to `SavedSet` (kebab-case GameConfig id, matching the URL `?game=` param exactly).
- Bump the storage key to `saved-numbers-v2` and validate the new shape on load.
- One-shot migrate `saved-numbers-v1` → `v2` on first load: read the legacy list, tag every entry with `game: "euromillions"` (the only game pre-roll-out), write `v2`, delete `v1`. The migration runs at most once per browser and is idempotent if `v2` already exists (no-op).
- `useSavedNumbers` takes a `gameId` argument. The returned `list` is filtered to that game; `add(numbers)` auto-tags new sets with the active game id; `remove(id)` still operates on the global store. Each consumer threads `game.id` from `useData()` — the three call sites already had `game` in scope, so no new prop drilling.

**Rationale:**
- A schema bump with an explicit migration was preferred over silently overloading the v1 shape (e.g. inferring game from number ranges) because (a) it is auditable in storage — you can inspect the v2 entries and see exactly which game each belongs to, (b) the inference would mislabel boundary cases (e.g. a set of all-low EuroMillions numbers would also be valid Lotto), and (c) v1 had no version field so any future schema bump benefits from establishing the explicit-key precedent.
- The hook owns the filter rather than the consumer because there are three consumers and only one canonical filter rule. Centralising it removes one class of bug ("forgot to filter on the home page").
- `add()` closes over `gameId` via `useCallback([gameId])` so a user who saves a set after switching games gets the new game tag — not the one in scope at component mount. This is the only correct behaviour but worth calling out because it depends on the dependency array being right.
- Heading copy was changed to `Saved <GameName> sets` (and the empty-state to match) so a user who switches games and finds an empty list understands *why* the list is empty rather than thinking they lost data.

**Consequences:**
- The v1 storage key is gone forever after the first post-deploy load on each browser. If we ever need to rescue a v1 list manually, the migration logic in `loadFromStorage()` is the reference for the assumed-EuroMillions tagging.
- The `remove(id)` callback intentionally does not check that the removed id belongs to the active game. With the filtered UI you can only ever click "remove" on a set the active game owns, so the check would be dead code; and if a future feature wants cross-game removal (e.g. an "Archive" view that lists everything), it gets that for free.
- Any tests/scripts that talked to `saved-numbers-v1` directly would need to be updated. None exist in the codebase today.

---
