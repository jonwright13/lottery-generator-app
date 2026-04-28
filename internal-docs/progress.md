# Refactor Progress

Tracking the multi-branch refactor sparked by the codebase critique. All six feature branches landed on `main` and were rebased to a linear history during a push reconciliation. Subsequent feature work happens on branches off `dev` (per the saved workflow memory).

## Session: 2026-04-28 — Release merge to main + un-ignore internal-docs

### Completed
**dev → main release merge**
- Merged `dev` into `main` with `--no-ff` as a single release commit covering ~40 feature merges going back to the per-game GameConfig refactor: multi-game runtime (EuroMillions / Lotto / Thunderball / Set For Life), generator constraints (AP-3 reject, last-digit cap, prev-draw overlap cap, pair + triplet cohesion, hot/cold rolling-window bias), Controls UX (qualifying-draws preview, plain-language labels, modified-vs-default dots, reset menu, per-game saved presets), the brand-new /analysis page (window filter with 6m/10y/custom range, 16 cards, jump-to-section TOC, floating back-to-top), home-page polish, /about page, and help popovers across the analysis cards.
- Hit one merge conflict in `public/data/thunderball.json`: main's daily cron had updated to 2026-04-24 (1,940 draws, history back to 2004), dev had a newer fetcher producing 2,929 draws but only back to 2010 because the new per-game scraper drops the pre-2010 once-a-week archive. Took dev's version (`git checkout --theirs`) because the new scraper is the canonical going-forward producer — keeping main's older format would just be overwritten on the next cron run, and the pre-2010 history is gone the moment fetch:data runs again anyway.
- The mismatched archive cutoff is documented in future-ideas.md as something to revisit if we ever want the full Thunderball history back (would mean teaching `scripts/data-sources.mjs` about the pre-2010 archive format on lottery.merseyworld.com).

**Un-ignored `internal-docs/`**
- Removed the `/internal-docs` line from `.gitignore` so progress / decisions / future-ideas land in the repo from now on. They've been useful enough across the multi-session work that locking them away locally was the wrong call — anyone cloning the repo (including future-me on a different machine) gets the full project context.
- Existing entries are preserved verbatim (no rewriting; per the global instructions, history is append-only).

### Files Changed
- `public/data/thunderball.json` — resolved by taking dev's version.
- `.gitignore` — removed the `/internal-docs` entry.
- `internal-docs/progress.md`, `internal-docs/decisions.md`, `internal-docs/future-ideas.md` — added to source control for the first time.

### Verified
- Merge resolved cleanly; `git status` showed only the staged data-file fix before commit.
- `npm run build` clean post-merge.

### Git State
- `main` carries the release merge. User pushes `main` to origin. Closing the project for now.

### Next
- Project closed. If revisited, the open ideas in future-ideas.md (Thunderball pre-2010 archive, anything new) are the natural pickup points.

---

## Session: 2026-04-28 — /analysis page navigation aids

### Completed
**Jump-to-section TOC + floating back-to-top button**
- `components/back-to-top.tsx` — new generic component. Subscribes to `window.scroll`, renders a `fixed bottom-6 right-6` icon button (Lucide `ArrowUp`, secondary variant, rounded-full with shadow) once `scrollY > threshold` (default 400). Hides via `opacity-0 pointer-events-none` so the transition is smooth and the button can't be clicked while invisible. `title="Back to top"` and `aria-label="Back to top"` for both keyboard and tooltip discoverability. On click → `window.scrollTo({ top: 0, behavior: "smooth" })`.
- `components/analysis-components/section-toc.tsx` — new card-shaped TOC. Accepts `sections: SectionItem[]` (`{ id, label }`) and renders a 2/3/4-column grid of anchor links. Anchor `href={`#${id}`}` is preserved (so users can copy a deep link), but the click handler intercepts to call `scrollIntoView({ behavior: "smooth", block: "start" })` and `history.replaceState` so the URL hash updates without the browser's native instant-jump.
- `app/analysis/page.tsx` — defines a `SECTIONS` constant covering all 16 cards, wraps each card in `<section id="..." className="scroll-mt-6 w-full">` so anchor jumps land with a small breathing-room offset, renders `<SectionToc>` immediately above the first card (only when there's data), and mounts `<BackToTop />` at the bottom of the page so it's available throughout.

### Files Changed
- `components/back-to-top.tsx` — new.
- `components/analysis-components/section-toc.tsx` — new.
- `app/analysis/page.tsx` — wires SECTIONS + TOC + section wrappers + back-to-top.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested; user to confirm the smooth scroll feels right and that the back-to-top button only appears after a meaningful scroll (~400px).

### Git State
- Branch `feat/analysis-page-nav` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- No follow-ups in mind. The /analysis page nav surface is now: window filter → jump-to-section TOC → all 16 cards → floating back-to-top.

---

## Session: 2026-04-28 — Final analysis polish (multiples, max-pattern, custom range)

### Completed
**Two new /analysis cards and a richer window filter**
- `lib/generator/threshold-criteria/index.ts` — added `MultiplesDistributionData` interface and a `multiplesDistributionData` field populated alongside `maxMultiplesAllowed` from the per-base `analyzeMultiplesDistribution` results. Constructor inlines the loop so each base is analysed once and both the cap dict and the per-base distribution dict are stored. Removed the now-unused `generateMaxMultiplesAllowed` wrapper (no external callers).
- `components/analysis-components/multiples-distribution.tsx` — new card. Per base (2..10) renders a single horizontal stacked-segment bar where each segment is one count value 0..mainCount, segments above the 95th-percentile cap shown in red. Right-side columns: cap value (`≤ K`) and within-cap percentage. Uses `analysis.game.main.count` rather than pulling `useData()` so the windowed analysis instance keeps the per-window mainCount intact.
- `components/analysis-components/max-pattern-probabilities.tsx` — new card. Parses the `<m>_main+<l>_lucky[_special_<n>]` keys from `analysis.maxPatternProbs` into readable labels ("5 main + 2 lucky", "5 main + lucky #1") and renders one bar per pattern, sorted descending by main/lucky/special. Help popover spells out that the values are average per-position rates, **not** joint pattern probabilities — so a 0.8% reading does not mean "0.8% chance of hitting 5+2 next draw".
- `components/analysis-components/window-filter.tsx` — extended preset list to `all | 10y | 5y | 1y | 6m | custom`. Exports `resolveWindowBounds(windowKey, customFrom, customTo)` returning `{ from, to }` ISO strings (either may be null = unbounded), so callers don't need to know which preset uses years vs months. Custom presents two `<input type="date">` fields with min/max wiring against each other so the user can't pick from > to.
- `app/analysis/page.tsx` — uses `resolveWindowBounds` for the slice. URL state extended with optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` params. Switching to "Custom" seeds the missing date(s) from `seedCustomRange()` (last 6 months → today). Switching back to any preset clears `from/to`. Both `MultiplesDistribution` and `MaxPatternProbabilities` cards mounted; the latter sits between `TopNumbersPerPosition` and `SumDistribution`, the former after `LastDigitDistribution`.
- `components/match-results.tsx` — adapted to the new `WINDOW_OPTIONS` shape (the `years` field is gone). Filters out the "custom" preset for its compact button row (the historical-matches card on the home page doesn't need a custom range) and uses `resolveWindowBounds(windowKey, null, null)` for the slice.

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — multiplesDistributionData wiring; deleted unused `generateMaxMultiplesAllowed`.
- `components/analysis-components/multiples-distribution.tsx` — new.
- `components/analysis-components/max-pattern-probabilities.tsx` — new.
- `components/analysis-components/window-filter.tsx` — new presets, `resolveWindowBounds`, custom-date inputs.
- `app/analysis/page.tsx` — wires both new cards, plumbs custom-range URL params.
- `components/match-results.tsx` — adapted to the new filter shape.
- `internal-docs/future-ideas.md` — flipped multiples-of-N caps card, max-pattern-probabilities card, and custom-range / extra preset items to **Implemented**.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender (initial build failed on `match-results.tsx` referencing the removed `years` field; fixed).
- Not click-tested in browser yet; user to confirm the multiples bars render proportionally (most weight should sit on count 0–1 for high bases like 7+, with red sliver at the right tail), the max-pattern numbers look like single-digit percentages, and the custom date inputs filter correctly.

### Git State
- Branch `feat/analysis-final-polish` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Click-test the new cards and date-range UI in browser. No further future-ideas.md items remain open.

---

## Session: 2026-04-28 — More analysis sections (triplets + consecutive runs)

### Completed
**Two new cards on /analysis**
- `lib/generator/threshold-criteria/index.ts` — new `ConsecutiveRunDistribution` interface and `analyzeConsecutiveRunDistribution` method that buckets each historical draw by its longest consecutive-run length. Mirrors the in-flight algorithm `countMaxConsecutiveRun` from generate-numbers/utils.ts but inlined here so the analysis result lives on `ThresholdCriteria` alongside the other distributions. Field name `consecutiveRunData`.
- `components/analysis-components/triplet-cooccurrence.tsx` — new card mirroring the pair-cooccurrence layout: top-12 hottest triplets as horizontal bars, count-distribution histogram, summary dl. Uses the `tripletCoOccurrenceData` we shipped earlier today. Help-popover spells out the SNR caveat: most triplets sit at 0-1 hits because three-way overlap is intrinsically rare.
- `components/analysis-components/consecutive-run-distribution.tsx` — new card visualising the run-length distribution. Rows ≥3 (the generator's hard reject threshold) are highlighted in red and counted in a "would be rejected" / "would pass the run rule" summary so the user can see exactly how strict the rule is in historical terms (typically <5% of historical draws would be rejected).
- `app/analysis/page.tsx` — wires both cards into the page, after the AP-3 distribution and pair card respectively. Both pass `windowedAnalysis` so they respect the active window filter.

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — new analysis method + field.
- `components/analysis-components/triplet-cooccurrence.tsx` — new card.
- `components/analysis-components/consecutive-run-distribution.tsx` — new card.
- `app/analysis/page.tsx` — register both cards.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested in browser yet; user to confirm the run distribution looks sensible (most draws should sit at run-length 1 or 2, with a tail at 3 marked red) and the triplet histogram skews hard left toward count 1.

### Git State
- Branch `feat/more-analysis-sections` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Polish backlog cleared. Open follow-ups still in future-ideas.md: multiples-of-N caps card, max pattern probabilities card, custom-range / extra preset on the analysis window filter.

---

## Session: 2026-04-28 — Save Controls presets per game

### Completed
**Per-game saved Controls preset, with auto-load on return**
- `hooks/use-saved-controls.ts` — new hook modelled on `use-saved-numbers.ts`. Module-level state holding `Record<gameId, GenerateValidNumberSetOptions>` backed by localStorage key `saved-controls-v1`. Uses `useSyncExternalStore` so multiple consumers see the same in-memory snapshot and writes propagate instantly. Returns `{ savedOptions, save, clear, hydrated }` for the active game.
- `context/useDataProvider.tsx` — provider now subscribes to `useSavedControls(game.id)` and prefers the saved preset over the seeded defaults as the genOptions starting point. Adds a `targetBootKey = "<gameId>::<initial|hydrated>"` swap pattern so two transitions trigger a reseed: a game change (different gameId) and the post-hydration jump from server snapshot to real saved store. Both go through `setGenOptions(savedOptions ?? seededOptions)`. New context fields: `savedOptions`, `saveOptions`, `restoreSavedOptions`, `clearSavedOptions`, `isAtSaved`, `hasSavedOptions`. Existing `resetOptions` / `isAtDefaults` are unchanged so the previous "reset to data-derived defaults" behaviour is intact.
- `components/generator-components/generator-controls/index.tsx` — header gains a Save (or "Update" once a preset exists) button alongside the existing Reset. Save button is disabled when current matches saved (with a check icon and a "Already matches the saved preset" tooltip). Reset becomes a Radix DropdownMenu with up to three actions: "Reset to defaults" (disabled when at defaults), "Reset to saved preset" (only shown when a preset exists; disabled when at saved), and "Clear saved preset" (only shown when a preset exists, in danger-red). Toasts confirm save/restore/clear so the user has feedback that the localStorage write happened.
- The dropdown's trigger button auto-disables when neither option is actionable (current === defaults AND (no preset OR current === saved)) — that way the button doesn't open an empty/all-greyed menu.

### Files Changed
- `hooks/use-saved-controls.ts` — new hook.
- `context/useDataProvider.tsx` — saved-preset wiring + bootKey reseed pattern + new context fields.
- `components/generator-components/generator-controls/index.tsx` — Save button + Reset dropdown menu + toasts.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean. (Initial build failed on a `Record<string, unknown>` → `GenerateValidNumberSetOptions` cast that needed `as unknown as` to satisfy strict mode; fixed.)
- Trace-through of state transitions: first visit (no saved) loads seeded → user tweaks and Saves → `savedOptions` populated, `isAtSaved` true, button shows "Update" with check icon. User tweaks more → "Update" enabled, click → preset overwritten. User switches to another game and back → bootKey diff triggers `setGenOptions(savedOptions)`, preset auto-loaded. User clears the preset → saved store entry removed, dropdown loses the saved-related items, Save button reverts to "Save".
- Not click-tested in browser yet; user to confirm the auto-load on a fresh page reload after saving.

### Git State
- Branch `feat/save-controls-presets` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Resume the paused "more analysis sections" task (#55).

---

## Session: 2026-04-28 — Live "qualifying draws" preview on Controls

### Completed
**Cumulative qualifying-draws count in the Controls header**
- `lib/generator/count-qualifying-draws.ts` — new helper `countQualifyingDraws(pastNumbers, options)` that reuses the existing `evaluateRules` chain (`mainRules` + `luckyRules`) to count how many historical draws would pass the current constraint set. Sorts mains/lucky defensively (the rule helpers assume sorted input — the generator gets that free from `generateUniqueNumbers`, but historical tuples can vary). Uses `pastNumbers[i+1]` as the previous-draw context for the previous-draw-overlap rule (newest-first array convention).
- `lib/generator/index.ts` — re-exports `countQualifyingDraws` and `QualifyingDrawsCount`.
- `components/generator-components/generator-controls/index.tsx` — wraps the helper in `useMemo([pastNumbers, genOptions])` and renders the count in the Controls card header (between the heading and the Reset button). Shows "X of Y draws qualify" with three-tier colouring: muted ≥25%, amber 5-25%, red <5% (so the user sees at a glance when they've over-tightened). Tooltip names the active game and shows the exact percentage. Header now wraps on narrow screens so the count, heading and Reset button don't squash.

### Files Changed
- `lib/generator/count-qualifying-draws.ts` — new helper.
- `lib/generator/index.ts` — re-export.
- `components/generator-components/generator-controls/index.tsx` — header layout + qualifying memo + tooltip.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Reasoning check: at seeded defaults sumMin/sumMax sit at 15th/85th percentile (~70% pass) and other thresholds at the 95th percentile (~95% pass each). The rules intersect, so the cumulative count should land somewhere in the 50-70% range. If a user moves all the way to e.g. odd-only or sum < 10, the indicator turns red — exactly the feedback the future-ideas note was asking for.
- Not click-tested in browser yet; user to confirm the colour transitions feel right and the tooltip wording is clear.

### Git State
- Branch `feat/qualifying-draws-preview` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Last item on the polish backlog: more analysis sections (gap distributions per position, multiples-of-N caps, consecutive-run frequencies, "least-drawn numbers" mirror).

---

## Session: 2026-04-28 — Triplet co-occurrence scoring

### Completed
**Triplet co-occurrence as an optional generator scoring axis**
- `lib/generator/threshold-criteria/index.ts` — new `TripletCoOccurrenceAnalysis` interface and `analyzeTripletCoOccurrence` method that builds a `Record<"a,b,c", number>` of historical hits across all C(mainCount, 3) triplets per draw. Matrix is bounded by C(maxMain, 3): EuroMillions/SFL ~16-20k entries, Lotto ~32k, Thunderball ~9k. `meanTripletCount` divides by the *full* C(maxMain, 3) space (including never-drawn triplets) so the value reads "drawn N times across all possible triplets". Doc comment flags the SNR caveat.
- `lib/generator/types.ts` — adds `tripletScoreWeight: number` to `GenerateValidNumberSetOptions` and `bestTripletScore: number` to the result.
- `lib/generator/constants.ts` — `tripletScoreWeight: 0` default (off until the user opts in).
- `lib/generator/generate-numbers/index.ts` — accepts an optional `precomputedTripletCounts`. The triplet matrix is only built/passed when `tripletScoreWeight > 0` (saves ~250-500 KB postMessage marshalling on the no-op path). Scoring uses a *layered* blend: `pairBlended = (1-pw)*positionBlended + pw*pairScore`, then `combined = (1-tw)*pairBlended + tw*tripletScore`. Each weight is independent and well-defined; setting either to 0 cleanly disables that layer. Result type now exposes `bestTripletScore`.
- `workers/generateNumbers.worker.ts` + `hooks/use-generator.ts` — plumb `tripletCounts` through.
- `app/page.tsx` — passes `analysis.tripletCoOccurrenceData.tripletCounts` only when `tripletScoreWeight > 0` so we don't pay the marshalling cost when the feature is dormant.
- `components/generator-components/generator-controls/accordion-items/triplet-score-weight.tsx` — new accordion item, mirrors the pair version. Includes a one-line note about the SNR limitation.
- `components/generator-components/generator-controls/index.tsx` — new accordion entry placed directly after pair-score-weight; also wires the modified-vs-default dot.
- `components/generator-components/generator-container/index.tsx` — adds a "Triplet-cohesion score" row to the post-generate stats dl, only shown when `bestTripletScore > 0` (mirrors the recent-frequency conditional row).

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — new analysis method + field.
- `lib/generator/types.ts` — option + result fields.
- `lib/generator/constants.ts` — default `tripletScoreWeight: 0`.
- `lib/generator/generate-numbers/index.ts` — `buildTripletCounts`, optional precompute, layered blend, result wiring.
- `workers/generateNumbers.worker.ts` — accept and forward `tripletCounts`.
- `hooks/use-generator.ts` — forward `tripletCounts` through `postMessage`.
- `app/page.tsx` — conditional triplet-counts pass.
- `components/generator-components/generator-controls/accordion-items/triplet-score-weight.tsx` — new control.
- `components/generator-components/generator-controls/accordion-items/index.tsx` — re-export.
- `components/generator-components/generator-controls/index.tsx` — new accordion item.
- `components/generator-components/generator-container/index.tsx` — Triplet-cohesion stats row.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Behavioural smoke: at default `tripletScoreWeight=0` the layered blend collapses to the previous pair-blended formula (verified by code inspection: `(1-0)*pairBlended + 0*tripletScore === pairBlended`), so the existing experience is byte-identical.
- Not click-tested in browser yet; once verified the generator should produce different best-scores when nudging the triplet weight, with the new "Triplet-cohesion score" row appearing in the stats dl.

### Git State
- Branch `feat/triplet-cooccurrence` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Live "%-qualify" preview per Controls accordion, then more analysis sections.

---

## Session: 2026-04-28 — Heatmap cell drill-down

### Completed
**Click-to-drill on heatmap cells**
- `components/position-heat-map/position-heat-map.tsx` — extracted each cell into a `HeatmapCell` sub-component wrapping the existing `<button>` with a Radix Popover. Click opens a 288px-wide popover showing: `Position {label}, Number {n}`, the count out of total draws and the percentage, and the most-recent ≤8 draws where this number landed in this slot (date + full draw, with the bonus segment coloured amber). When the cell has zero matches the popover shows "Never drawn in this slot." `findRecentMatches` walks `pastNumbers` newest-first and short-circuits at 8 hits, so cost is O(N) per popover open and only on demand.
- The cells were already `<button>` elements but had no click handler — that was a11y noise (the future-ideas note flagged it). Now the click is meaningful, `aria-label` describes the cell content for screen readers, and `onFocus`/`onBlur` mirror the hover state so keyboard users see the same details under the grid as mouse users do.
- `components/position-heat-map/index.tsx` — `Heatmap` now accepts optional `pastNumbers`/`dates` overrides (defaults to full-history from `useData`). Required so the analysis page's windowed view shows windowed drill-downs instead of full-history matches.
- `app/analysis/page.tsx` — passes `windowedPast`/`windowedDates` to `Heatmap` so the popover stays consistent with the active window selection.

### Files Changed
- `components/position-heat-map/position-heat-map.tsx` — `HeatmapCell` sub-component, `DrillDownContent`, `findRecentMatches`, focus-mirrors-hover, aria-label.
- `components/position-heat-map/index.tsx` — optional `pastNumbers`/`dates` props, defaulted from `useData`; pass through to `PositionHeatmap` along with `mainCount`.
- `app/analysis/page.tsx` — pass windowed past/dates through to `Heatmap`.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested in browser yet; user to confirm popover positioning, scroll behaviour on cells near the right edge, and that windowed analysis reflects in the popover content.

### Git State
- Branch `feat/heatmap-drilldown` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Triplet co-occurrence, then live %-qualify preview, then more analysis sections.

---

## Session: 2026-04-28 — Onboarding hint on the Generate empty state

### Completed
**First-time empty state on the Generate card**
- `hooks/use-game-aware-href.ts` — extracted from `components/nav.tsx` so it can be reused. The hook reads the active `?game=` from the URL and produces a closure that prefixes `/path` with the param. Same behaviour, just in its own file.
- `components/nav.tsx` — re-imports the hook from `@/hooks/use-game-aware-href`, drops the local copy.
- `components/generator-components/generator-container/index.tsx` — empty state is now a small two-line stack: the existing "Click Generate numbers..." (now namechecks the active game so it reads as "tuned to Lotto's historical draws" / "EuroMillions's", etc.) plus a small muted "What is this?" link to `/about`. Game param preserved via `withGame("/about")`.

### Files Changed
- `hooks/use-game-aware-href.ts` — new file (extracted hook).
- `components/nav.tsx` — import the hook from the new location.
- `components/generator-components/generator-container/index.tsx` — onboarding hint + game-name in the lead sentence.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.

### Git State
- Branch `feat/onboarding-hint` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Heatmap drill-down on click, then triplet co-occurrence, live %-qualify preview, more analysis sections.

---

## Session: 2026-04-28 — Modified-vs-default indicator on Controls

### Completed
**Per-control "modified from default" dot**
- `context/useDataProvider.tsx` — exposes `seededOptions` on the data context (it was already computed; only the `interface` and `value` memo entry were missing). Consumers can now diff individual keys against the seed without re-deriving it.
- `components/generator-components/generator-controls/index.tsx` — `TriggerRow` accepts a `modified?: boolean` and renders a small amber dot (`size-1.5`, `bg-amber-500`) to the left of the value column when set. Each accordion trigger passes its own `modified` value, computed by an `isModified(...keys)` helper that uses `JSON.stringify` for deep equality (handles tuple `oddRange` and the multiples-allowed object). Pair the dot with `aria-label="Modified from default"` and a matching `title` for sighted hover.
- The dot complements the Reset button: skim the Controls card and you can see at a glance which rows have been customised, then either reset everything or open the row and tweak.

### Files Changed
- `context/useDataProvider.tsx` — add `seededOptions` to context type and value memo.
- `components/generator-components/generator-controls/index.tsx` — `TriggerRow.modified` prop + per-row `isModified(...)` calls.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested; visual confirmation pending.

### Git State
- Branch `feat/controls-modified-indicator` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Continue: onboarding hint / first-time empty state, then heatmap drill-down, triplet co-occurrence, live %-qualify preview, more analysis sections.

---

## Session: 2026-04-28 — Plain-language relabel for Controls

### Completed
**Plain-language labels on the Controls accordion**
- `components/generator-components/generator-controls/index.tsx` — every accordion trigger now leads with a plain-language summary ("How clumpy the numbers can be", "Balance of odd and even numbers", "How far apart the numbers can sit", etc.) and demotes the technical name ("Cluster max", "Odd/even split", "Gap distribution") to a small muted helper line beneath. The `TriggerRow` component grew an optional `helper` prop and switched from `items-center` to `items-start` so the value column lines up with the primary label even when the helper line wraps. The current value (right-aligned) is unchanged.
- The strategy is "primary = casual user; helper = power user". Casual users get a sentence they can read; power users still get the term they recognise from analysis docs and the broader generator codebase.

### Files Changed
- `components/generator-components/generator-controls/index.tsx` — `TriggerRow` accepts `helper`; all 10 accordion triggers updated to plain-language label + technical helper.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested in browser yet; layout change is small (extra subtitle line, two-column trigger row instead of single).

### Git State
- Branch `feat/controls-plain-language` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Continue down the polish backlog: modified-vs-default indicator on Controls triggers, then onboarding hint, heatmap drill-down, triplet co-occurrence, live %-qualify preview, more analysis sections.

---

## Session: 2026-04-28 — Reset to defaults on Controls

### Completed
**Reset-to-defaults affordance on the Controls card**
- `context/useDataProvider.tsx` — exposes two new fields on the data context: `resetOptions: () => void` (calls `setGenOptions(seededOptions)`) and `isAtDefaults: boolean` (compares `genOptions` to `seededOptions` via `JSON.stringify`; the two objects share the same code path for key order, so this gives stable deep equality without pulling in a comparator library).
- `components/generator-components/generator-controls/index.tsx` — Controls card header now has a small ghost-style "Reset" button (lucide `RotateCcwIcon`) on the right of the heading. Disabled when `isAtDefaults`. Tooltip distinguishes the two states ("Already at data-derived defaults" vs "Reset to data-derived defaults"). Reset reseeds *all* options (including `DEFAULT_OPTIONS`-sourced ones like `maxIterations`, `pairScoreWeight`) since `seededOptions` is a complete `GenerateValidNumberSetOptions`.

### Files Changed
- `context/useDataProvider.tsx` — add `resetOptions`, `isAtDefaults` to context value + memo deps.
- `components/generator-components/generator-controls/index.tsx` — wrap heading in flex row with the new Reset button + tooltip; pull `resetOptions` and `isAtDefaults` from `useData()`.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- Not click-tested yet — leaving for the user to confirm the button enables when a control is touched and disables again on reset.

### Git State
- Branch `feat/reset-controls` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Continue the UX polish backlog: plain-language relabel for Controls (next up), then the four low-priority items (modified-vs-default indicator, onboarding hint, heatmap drill-down, triplet co-occurrence), then the two remaining medium items (live %-qualify preview, more analysis sections).

---

## Session: 2026-04-28 — Saved sets scoped per game

### Completed
**Per-game saved sets**
- `hooks/use-saved-numbers.ts` — schema bumped v1 → v2. Each `SavedSet` now carries a `game: string` (kebab-case GameConfig id). New storage key `saved-numbers-v2`; one-shot migration from `saved-numbers-v1` tags every legacy set with `game: "euromillions"` (per the user note that all pre-existing saved sets were EuroMillions). Migration runs at most once per browser; v1 key is removed after the rewrite. The hook now takes `(gameId)`: `list` is filtered to that game, `add(numbers)` auto-tags new sets with `gameId`, `remove(id)` still operates on the global store (saved-set ids are unique across games, so cross-game removal is safe even if not user-reachable through the filtered UI).
- Three consumers updated to pass `game.id`:
  - `app/check-numbers/page.tsx`
  - `components/saved-sets-list.tsx`
  - `components/generator-components/generator-container/index.tsx`
- `components/saved-sets-list.tsx` — heading reads `Saved <GameName> sets` and the empty-state copy now reads `No saved <GameName> sets yet` so a user switching games doesn't see a misleading blanket "no saved numbers" when they may have plenty under a different game.

### Files Changed
- `hooks/use-saved-numbers.ts` — v2 schema, migration, `useSavedNumbers(gameId)` signature, list filter, auto-tagging `add()`.
- `components/saved-sets-list.tsx` — pass `game.id`; game-aware heading + empty-state copy.
- `app/check-numbers/page.tsx` — pass `game.id` to `useSavedNumbers`.
- `components/generator-components/generator-container/index.tsx` — pass `game.id` to `useSavedNumbers`.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- HTTP smoke of `/check-numbers?game=<id>` for all four games confirms the heading reflects the active game (`Saved EuroMillions sets` / `Saved Lotto sets` / `Saved Set For Life sets` / `Saved Thunderball sets`).
- **Migration not exercised in CI** — the v1 → v2 migration runs only when a real browser has a `saved-numbers-v1` localStorage entry. Logic is straightforward and covered by the type guards, but worth a quick manual check on the user's actual browser: open the app once, confirm the existing EuroMillions saved sets are still listed when on EuroMillions, and gone when on any other game. After that first load, `localStorage.getItem("saved-numbers-v1")` should be `null` and `saved-numbers-v2` should hold the migrated array.

### Git State
- Branch `feat/saved-sets-per-game` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- No specific follow-up. The hook is now strictly more capable than v1 and the data is correctly partitioned for the multi-game UI.

---

## Session: 2026-04-28 — Thunderball (branch 5 of multi-game roll-out, completes the rollout)

### Completed
**Thunderball registered as the fourth and final game**
- `lib/games/thunderball.ts` — new GameConfig: 5 mains 1–39 + 1 Thunderball 1–14. Draws Tue/Wed/Fri/Sat (4× per week — explains why the dataset is ~3x the size of the others). 9 prize tiers including the unusual `[0, 1]` tier (matching just the Thunderball wins £3, with zero mains correct). `countMatchesByTier` keys on the `(mainHits, bonusHits)` pair so this works without code changes.
- `lib/games/index.ts` — `GAMES = [EUROMILLIONS, LOTTO, SET_FOR_LIFE, THUNDERBALL]`. Default unchanged.
- `scripts/data-sources.mjs` — added `fetchThunderball = makeLotteryCoUkFetcher({...})` with `slug=thunderball`, `mainClass=thunderball-ball`, `bonusClass=thunderball-thunderball`. Cutoff 2010-05-10 (5/34 → 5/39 matrix change).
- `public/data/thunderball.json` — 2929 real draws (2010-05-12 → 2026-04-25), max main observed = 39 (confirming the cutoff filter dropped pre-2010 5/34-era draws).
- `context/useDataProvider.tsx` — imported `thunderball.json` and added `"thunderball"` to the `RAW_DATA` map.

### Files Changed
- `lib/games/thunderball.ts` — new GameConfig.
- `lib/games/index.ts` — register THUNDERBALL in `GAMES`.
- `scripts/data-sources.mjs` — `fetchThunderball` factory call + DATA_SOURCES entry + cutoff constant.
- `public/data/thunderball.json` — new file, 2929 draws.
- `context/useDataProvider.tsx` — import + RAW_DATA entry.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- `npm run fetch:data --game thunderball` produced 2929 valid rows. Validation: length 6, zero-padded, mains 1-39, bonus 1-14, dates >= 2010-05-10, monotonically newest-first, no duplicate dates.
- HTTP smoke test of `/`, `/check-numbers`, `/analysis`, `/historical` with `?game=thunderball` all return 200; check-numbers form shows 6 input fields with `max=39` × 5 + `max=14` × 1; analysis page reports 2929 historical draws.
- **Bundle size sanity**: total game JSON across the four games is ~615 KB — `set-for-life.json` 76 KB, `euromillions.json` 114 KB, `lotto.json` 126 KB, `thunderball.json` 299 KB. Thunderball is 2.4× the others because of 4 draws/week. We're under the threshold I called out in ADR-012 (5+ games → dynamic imports), but with Thunderball alone now consuming half the JSON budget the next round of work should consider lazy-loading.
- **Not click-tested in browser** — switcher behavior was verified end-to-end in branch 3; this branch only adds another entry to a working list.

### Git State
- Branch `feat/thunderball` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Multi-game roll-out is complete. Possible follow-ups: (a) dynamic imports per-game JSON if bundle size becomes a problem, (b) per-game prize amounts in `prizeTiers` if we ever want to display "what would you have won" copy, (c) sticky game preference via cookie/localStorage as a fallback when no `?game=` is in the URL.

---

## Session: 2026-04-28 — Set For Life (branch 4 of multi-game roll-out)

### Completed
**Set For Life registered as the third game**
- `lib/games/set-for-life.ts` — new GameConfig: 5 mains 1–47 + 1 Life Ball 1–10. Mon/Thu draws. 9 prize tiers from `5+Life` (top prize) down to `1+Life` (free Lucky Dip). Cutoff = 2019-03-18 (game launch; no format changes).
- `lib/games/index.ts` — `GAMES = [EUROMILLIONS, LOTTO, SET_FOR_LIFE]`. Default unchanged.
- `scripts/data-sources.mjs` — added `fetchSetForLife = makeLotteryCoUkFetcher({...})` with `slug=set-for-life`, `mainClass=setForLife-ball`, `bonusClass=setForLife-life-ball`. Adding the third game is a one-factory-call entry now that the generic scraper is in place.
- `public/data/set-for-life.json` — 743 real draws (2019-03-18 → 2026-04-27), shape-validated.
- `context/useDataProvider.tsx` — imported `set-for-life.json` and added `"set-for-life"` to the `RAW_DATA` map.

### Files Changed
- `lib/games/set-for-life.ts` — new GameConfig.
- `lib/games/index.ts` — register SET_FOR_LIFE in `GAMES`.
- `scripts/data-sources.mjs` — `fetchSetForLife` factory call + DATA_SOURCES entry.
- `public/data/set-for-life.json` — new file, 743 draws.
- `context/useDataProvider.tsx` — import + RAW_DATA entry.

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender.
- `npm run fetch:data --game set-for-life` produced 743 valid rows. Validation: length 6, zero-padded, mains 1-47, bonus 1-10, dates >= 2019-03-18, monotonically newest-first, no duplicate dates.
- HTTP smoke test of `/?game=set-for-life`, `/check-numbers?game=set-for-life`, `/analysis?game=set-for-life`, `/historical?game=set-for-life` — all 200, all render "Set For Life" in the HTML, check-numbers form shows 6 input fields with correct caps (`max=47` × 5 + `max=10` × 1).
- **Not click-tested in browser** — switcher behavior was already verified end-to-end in branch 3; this branch only adds another entry to a working list.

### Git State
- Branch `feat/set-for-life` off `dev`. Ready to merge with `--no-ff`; not pushing.

### Next
- Branch 5: Thunderball (5/39 + 1/14). Same one-factory-call pattern.

---

## Session: 2026-04-28 — Lotto + game switcher (branch 3 of multi-game roll-out)

### Completed
**Lotto registered as the second real game**
- `lib/games/lotto.ts` — new GameConfig: 6 mains 1–59 + 1 Bonus drawn from the same 1–59 pool, modeled as a separate ball set so `ThresholdCriteria` analyses it as a distinct dimension. Prize tiers: [6,0],[5,1],[5,0],[4,0],[3,0],[2,0]. Cutoff is 2015-10-10 (49→59 ball change).
- `lib/games/index.ts` — `GAMES = [EUROMILLIONS, LOTTO]`. Default unchanged.
- `public/data/lotto.json` — 1101 real Lotto draws (2015-10-10 → 2026-04-25), no bonus-vs-mains overlap.

**Generic lottery.co.uk archive scraper**
- `scripts/data-sources.mjs` — refactored. Extracted `parseLotteryCoUkPage(html, opts)` and `makeLotteryCoUkFetcher(opts)`; both EuroMillions and Lotto are now thin factory calls. Same shape (slug, mainClass, bonusClass, mainCount, bonusCount, startYear, cutoff). Sets up cleanly for SFL + Thunderball in branches 4-5.

**Game-aware DataProvider via URL `?game=` param**
- `context/useDataProvider.tsx` — reads `useSearchParams().get("game")`, falls back to `DEFAULT_GAME_ID`, looks up the game in a static `RAW_DATA: Record<gameId, RawGameData>` map. All derived state (analysis, fields, seededOptions) moved into `useMemo([game])`. genOptions reseeds on game change via the React-blessed previous-render-id pattern (separate `useState(prevGameId)` + setState during render). Eslint's `react-hooks/refs` rule rejects the equivalent `useRef` form, so `useState` is the only path.
- `components/providers.tsx` — wraps `DataProvider` in `<Suspense fallback={null}>` because `useSearchParams` requires it.

**Game switcher UI in the navbar**
- `components/game-switcher.tsx` — new component. DropdownMenu + DropdownMenuRadioGroup listing every entry in `GAMES`, with the active game's name on the trigger. Selecting another game calls `router.replace(...)` (not push) with `scroll: false`. Omits the param from the URL when it equals `DEFAULT_GAME_ID`.
- `components/nav.tsx` — added `<GameSwitcher />` next to the title on every breakpoint. Extracted `useGameAwareHref()` so all in-app links (title, NavItems on desktop and in the mobile hamburger) preserve the active `?game=` across navigation. Without this, switching pages would silently revert non-default games.

**Bug fix in home page**
- `app/page.tsx` — previously hardcoded `const MAIN_COUNT = 5;` and used it to slice the generated combination into `userMain` / `userLucky`. For Lotto's 6+1 shape this slice was wrong (it would return 5 mains + an extra main lumped into the bonus side). Switched to `game.main.count` from `useData()`. Other consumers (check-numbers, generated-stats, generator-container) were already parameterized correctly from branch 1.

### Files Changed
- `lib/games/lotto.ts` — new GameConfig (6/59 + 1/59).
- `lib/games/index.ts` — register LOTTO in `GAMES`.
- `scripts/data-sources.mjs` — extract generic `parseLotteryCoUkPage` + `makeLotteryCoUkFetcher`; both EM and Lotto fetchers are factory calls now.
- `public/data/lotto.json` — new file, 1101 draws.
- `context/useDataProvider.tsx` — game-aware via URL; per-game useMemo; reseed genOptions on game switch.
- `components/providers.tsx` — Suspense boundary around DataProvider.
- `components/game-switcher.tsx` — new file, DropdownMenu + RadioGroup.
- `components/nav.tsx` — mounts GameSwitcher; `useGameAwareHref` preserves `?game=` across navigation.
- `app/page.tsx` — drop hardcoded `MAIN_COUNT = 5`, derive from `game.main.count`.
- `internal-docs/decisions.md` — added ADR-012 (multi-game runtime architecture).

### Verified
- `npm run lint` clean.
- `npm test` — all 45 vitest tests pass.
- `npm run build` — production build clean, all 8 routes prerender (with Suspense fallback handling for the dynamic `useSearchParams` opt-in).
- `npm run fetch:data --game lotto` produced 1101 valid rows. Validation: length 7, zero-padded, mains 1-59, bonus 1-59, dates >= 2015-10-10, monotonically newest-first, no duplicate dates, no row where the bonus equals one of the mains.
- HTTP smoke test against the running dev server: `/`, `/?game=lotto`, `/?game=euromillions`, `/check-numbers?game=lotto`, `/analysis?game=lotto`, `/historical?game=lotto` all return 200. The check-numbers page renders 7 input fields per game with the correct `max=` per slot (EM: five `max=50` + two `max=12`; Lotto: seven `max=59`).
- **Not verified manually**: clicking the dropdown to actually switch games in a real browser. Static HTML SSR is correct, build/lint/tests pass, and the URL-update pathway is the standard `useRouter().replace()` — but the runtime user-driven switch (and the genOptions reseed pattern firing at the right moment) needs a click-test to fully confirm.

### Git State
- Branch `feat/lotto-real` off `dev`. Ready to commit. Will merge into `dev` locally with `--no-ff`; not pushing.

### Next
- Branch 4: Set For Life (5/47 + 1/10). Reuses the generic `makeLotteryCoUkFetcher` — just add a GameConfig + DATA_SOURCES entry + RAW_DATA import.
- Branch 5: Thunderball (5/39 + 1/14). Same pattern.

---

## Session: 2026-04-28 — Pivot EuroMillions data source to lottery.co.uk archive scrape

### Completed
**Fix the broken `npm run fetch:data` job**
- Discovered `https://www.national-lottery.co.uk/results/euromillions/draw-history/csv` now returns XML for only the latest single draw, not the historical CSV. The sibling `/draw-history/xml` rejects automated User-Agents with 403. The official bulk-history endpoint we wired up in branch 2 (ADR-010) effectively no longer exists.
- Verified `lottery.co.uk`'s per-year archive pages (`/euromillions/results/archive-{year}`) expose machine-parseable draw rows back to 2004, with stable `euromillions-ball` / `euromillions-lucky-star` div classes and predictable `/euromillions/results-DD-MM-YYYY` anchor hrefs.

**Refactored the per-game source contract**
- `scripts/data-sources.mjs` — replaced `{ id, url, outFile, parser }` with `{ id, source, outFile, fetch }` where `fetch` is an async closure that owns its retrieval (single request, multi-page archive, anything) and returns `{ dates, results }`. Old CSV helpers (`padNum`, `parseDdMmmYyyy`, `splitCsvLines`, `parseEuroMillions`) are gone — each future game (Lotto/SFL/Thunderball) will write its own `fetch()` against `lottery.co.uk` instead of reusing a CSV parser.
- New `parseEuromillionsArchivePage(html)` slices the HTML between consecutive draw anchors and pulls 5 mains + 2 stars from each chunk via class-name regex. De-dupes by date so layout changes can't double-count.
- New `fetchEuroMillions()` pages from `archive-2016` to the current year with a 400 ms inter-page delay, throws if any past year parses to 0 rows (loud failure surfaces in cron logs), filters to `>= 2016-09-24` (Lucky Stars 1-12 cutoff), sorts newest-first.
- `scripts/fetch-data.mjs` — drop the URL/parser plumbing; just `await source.fetch()` and write the result. Hash-skip and `--game <id>` flag preserved.

**Refreshed `public/data/euromillions.json`**
- Ran `npm run fetch:data` end-to-end. Result: 1000 draws spanning 2016-09-27 → 2026-04-24. All shape checks pass (length 7, zero-padded, mains 1-50, stars 1-12, dates monotonically newest-first, no duplicates). Replaces the bootstrap 207-row file.

### Files Changed
- `scripts/data-sources.mjs` — full rewrite: per-source `fetch()` closure replaces shared CSV parser indirection. Adds `parseEuromillionsArchivePage` + `fetchEuroMillions` (year-paged HTML scrape, 400 ms delay, post-cutoff filter).
- `scripts/fetch-data.mjs` — invoke `source.fetch()` instead of `fetch(url) → parser()`. Validate `dates.length === results.length`. Hash-skip and `--game` CLI arg unchanged.
- `public/data/euromillions.json` — regenerated: 1000 real draws (vs the 207-row bootstrap) covering the entire Lucky Stars 1-12 era.
- `internal-docs/decisions.md` — added ADR-011 (supersedes URL choice in ADR-010, contract still applies).

### Verified
- `npm run fetch:data` end-to-end run from a clean dev shell. Logged per-year row counts (105/104/104/105/104/105/104/104/105/104/33 from 2016 through 2026), wrote 1000 rows after cutoff filter.
- Validation script (Node) confirmed: `allLen7=true, allPad2=true, mainsInRange=true, starsInRange=true, datesAfterCutoff=true, datesNewestFirst=true, duplicate dates=0`.
- `npm run lint` clean.
- Runtime code paths untouched (only build-time scripts + the data file changed), so no UI smoke test needed for this PR.

### Git State
- Branch `fix/euromillions-archive-fetch` off `dev`, ready to commit. Will merge into `dev` locally with `--no-ff` per workflow memory; not pushing.

### Next
- Branch 3 of the multi-game roll-out: register Lotto with the 2015-10-10 (49→59 ball) cutoff filter and add the top-of-page game switcher. Lotto's `fetch()` will mirror the EuroMillions one against `lottery.co.uk/lotto/results/archive-{year}`.

---

## Active feature branches

None. All recent feature branches have been merged into `dev` and deleted
locally:

- `feat/generated-stats` — merged as `a1ae26f` + `224c2b4` (`--no-ff`); deleted.
- `feat/historical-window-filter` — merged as `9d9e9a8` (`--no-ff`); deleted.
- `feat/generator-matches-and-analysis-page` — merged as `0ce406a` (`--no-ff`); deleted.
- `feat/home-ui-polish` — merged as `e91dfb9` (`--no-ff`); deleted.
- `feat/match-results-window-filter` — merged as `d25c7e7` (`--no-ff`); deleted.
- `feat/game-abstraction` — merged as `361e77e` (`--no-ff`); deleted.
- `feat/lottery-data-migration` — see session below; merged into `dev`.

## Session: 2026-04-27 — Lottery data migration (branch 2 of multi-game refactor)

### Completed
**Per-game CSV fetcher driven by a build-time data-source registry**
- `scripts/data-sources.mjs` — new file. Exports a `DATA_SOURCES`
  array (`{ id, url, outFile, parser }` per game) plus reusable
  helpers (`padNum`, `parseDdMmmYyyy`, `splitCsvLines`,
  `parseEuroMillions`). The parser handles
  `national-lottery.co.uk`'s column layout (`DrawDate`, `Ball 1..5`,
  `Lucky Star 1..2`, `UK Millionaire Maker`, `DrawNumber`), filters
  out pre-`2016-09-24` draws (Lucky Stars 1-11 era), and emits
  ascending-sorted zero-padded mains and stars in a flat 7-string
  array per draw.
- `scripts/fetch-data.mjs` — refactored to iterate `DATA_SOURCES`,
  fetch each URL, run its parser, write to its `outFile`. Hash
  comparison now ignores `fetchedAt` so quiet days don't churn the
  file. Added optional `--game <id>` CLI arg for fetching a single
  game in isolation during dev. The daily cron continues to call
  `npm run fetch:data` with no args.
- `.github/workflows/fetch-data.yml` — `git add public/data`
  (entire dir) replaces the specific `external-data.json` add. New
  games drop in without touching the workflow.

**EuroMillions registered as the (now sole) default game**
- `lib/games/euromillions.ts` — new GameConfig: 5 mains 1–50 + 2
  Lucky Stars 1–12, dataPath `/data/euromillions.json`, drawDays
  "Tue & Fri", and the official 12-tier prize structure (5+2 down
  through 2+1).
- `lib/games/index.ts` — `GAMES = [EUROMILLIONS]`,
  `DEFAULT_GAME_ID = "euromillions"`.
- `context/useDataProvider.tsx` — static import switched from
  `@/public/data/external-data.json` to
  `@/public/data/euromillions.json`. Empty-data error message now
  references `game.dataPath`.

**Synthetic Merseyworld feed retired**
- Deleted `lib/games/merseyworld-synthetic.ts`.
- Deleted `public/data/external-data.json`.

**Bootstrap data committed**
- `public/data/euromillions.json` ships with 207 real EuroMillions
  draws (2024 + 2025 from `lottery.co.uk`'s per-year archive —
  `national-lottery.co.uk` is unreachable from this dev sandbox).
  Sufficient density for every analysis card to produce coherent
  output on a fresh clone. Running `npm run fetch:data` (or the
  daily GH Actions cron) overwrites it with the full
  post-2016-09-24 history (~950+ draws).

**Test fix-up**
- `lib/lottery-match.test.ts` previously imported
  `MERSEYWORLD_SYNTHETIC` for its game arg. With the synthetic
  retired, the test now defines a minimal inline 5/50 + 2/11
  `GameConfig` so the canonical 9-tier ordering test stays
  byte-for-byte stable regardless of which real games are
  registered.

### Files Changed
- `scripts/data-sources.mjs` — new file, per-game URL + parser
  registry with the EuroMillions parser.
- `scripts/fetch-data.mjs` — rewritten to iterate the registry,
  per-game writes, `--game` flag, hash-on-data-only.
- `.github/workflows/fetch-data.yml` — generalised git-add path.
- `lib/games/euromillions.ts` — new EUROMILLIONS GameConfig.
- `lib/games/index.ts` — registry now exposes EuroMillions only.
- `lib/games/merseyworld-synthetic.ts` — DELETED.
- `public/data/euromillions.json` — NEW (207-draw bootstrap).
- `public/data/external-data.json` — DELETED.
- `context/useDataProvider.tsx` — switched data import to
  `euromillions.json`; error message references `game.dataPath`.
- `lib/lottery-match.test.ts` — define inline test GameConfig
  instead of importing the retired synthetic.
- `internal-docs/decisions.md` — appended ADR-010.
- `internal-docs/progress.md` — this entry.

### Verified
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npx vitest run` — 4 files, 45 tests, all pass.
- `npm run build` — production build succeeds, all 5 routes
  prerender as static.
- The actual fetch (`npm run fetch:data`) was not exercised from
  this dev sandbox because outbound HTTPS to `national-lottery.co.uk`
  is denied. Worth running locally on first switch to confirm the
  parser handles the live CSV cleanly, and to populate the file
  with the full ~950+ draw history.

### Git State
- Branch `feat/lottery-data-migration` (off `dev`). About to commit,
  merge `--no-ff` into `dev`, delete the feat branch. Not pushed —
  user owns the push to `origin/dev`.

### Next
- Branch 3 — `feat/lotto-real`: register real UK Lotto (6 mains
  1–59 + 1 bonus 1–59), with 2015-10-10 format-cutoff filter
  (49→59 ball change), and add the top-of-page game switcher (URL
  state via `?game=`) so EuroMillions/Lotto can be toggled. Then
  branches 4 (Set For Life) and 5 (Thunderball) drop in as new
  GameConfig + DATA_SOURCES entries with no further architectural
  work.

---


## Session: 2026-04-27 — Game abstraction (branch 1 of multi-game refactor)

### Completed
**Introduce `GameConfig` + variable-length `LotteryTuple`**
- Added `lib/games/` with `GameConfig` (id, name, drawDays, `main`/
  `bonus` ball-set shape, dataPath, ordered prizeTiers), the registry
  (`GAMES`, `DEFAULT_GAME_ID`, `getGameById`, `getDefaultGame`,
  `drawSize`), and the existing Merseyworld synthetic feed wired up
  as the lone registered game (`MERSEYWORLD_SYNTHETIC`).
- `LotteryTuple` is now `string[]` (variable-length flat array) instead
  of a fixed 7-string tuple. Storage shape is unchanged — the flat
  array is what `external-data.json` already serialises and what the
  historical-duplicate `Set` and heatmap keying both consume.
- `ThresholdCriteria` constructor signature is now
  `(lotteryNumbers, game, debug)`. Every internal hard-code (5/2/50)
  was replaced with reads from `game.main.count`, `game.bonus.count`,
  `game.main.max`. `getTopNumbersHistorical` now asserts against
  `game.main.count + game.bonus.count` rather than a literal 7.
- `generatePatternProbabilities(probs, mainCount, bonusCount)` derives
  its pattern table dynamically. The (5,2) output is byte-for-byte
  identical to the prior hard-coded 12-row list — the existing test
  was updated to pass the args explicitly and still passes.
- `countMatchesByTier(...)` takes a 4th `game` arg and reads tier
  ordering from `game.prizeTiers`. The `MAIN_COUNT = 5` literal
  inside `lib/lottery-match.ts` is gone.

**Wire game shape through the React tree via context**
- `useDataProvider` now exposes `game` (the active GameConfig) and
  `fields` (the per-position field defs derived from
  `buildFieldsForGame(game)`). Seeding of `genOptions` now also
  pulls `min/max/count` for both pools from the active game so the
  generator defaults stay coherent.
- `constants.ts` no longer exports a static `FIELDS` constant; it
  exports `buildFieldsForGame(game)` and a `FieldDef` interface. The
  five consumers (`historical/page`, `check-numbers/page`, `Heatmap`,
  `TopNumbersPerPosition`, plus the controls accordion) all read
  `fields` from `useData()` instead.
- All ~10 components that hard-coded `MAIN_COUNT = 5`,
  `MAIN_MAX = 50`, or `LUCKY_MAX = 11` (match-results, generated-stats,
  generator-container, sum-distribution, cluster-distribution,
  last-digit-distribution, hot-cold-numbers, previous-draw-overlap,
  number-frequency, odd-even-distribution, gap-distribution) now read
  from `useData().game`. Visible copy was reworded in a handful of
  places to drop the "5 main / 2 lucky" literals.
- `app/analysis/page.tsx` re-instantiates the windowed
  `ThresholdCriteria(wp, game, false)` with the active game.
- The gap-distribution analysis card and its companion controls
  accordion now hide the bonus section when `game.bonus.count <= 1`
  (no inter-bonus gaps to compute) — necessary preparation for SFL
  / Thunderball / Lotto in later branches.

**Saved-sets storage relaxed**
- `hooks/use-saved-numbers.ts` no longer rejects entries with
  `numbers.length !== 7`. Sets remain a flat `string[]`; per-set
  `gameId` is deferred to the switcher branch.

### Files Changed
- `lib/games/types.ts`, `lib/games/index.ts`,
  `lib/games/merseyworld-synthetic.ts` — new module: GameConfig +
  registry + the existing synthetic feed registered.
- `lib/generator/types.ts` — `LotteryTuple` becomes `string[]`.
- `lib/generator/threshold-criteria/index.ts` — constructor takes
  `game`; every analyser parameterised by mainCount/bonusCount/mainMax.
- `lib/generator/generate-pattern-probs.ts` — pattern table now
  generated from `(mainCount, bonusCount)`; (5,2) output unchanged.
- `lib/generator/generate-pattern-probs.test.ts` — updated to pass
  MAIN/BONUS args.
- `lib/lottery-match.ts` — accepts `game`; tier ordering from
  `game.prizeTiers`.
- `lib/lottery-match.test.ts` — updated to pass `MERSEYWORLD_SYNTHETIC`.
- `constants.ts` — `FIELDS` constant replaced with
  `buildFieldsForGame(game)` builder + `FieldDef` interface.
- `context/useDataProvider.tsx` — loads default game, exposes `game`
  + `fields`; seeds `genOptions` from game ranges/counts too.
- `app/page.tsx` — no behaviour change (consumes `useData()` as
  before).
- `app/historical/page.tsx`, `app/check-numbers/page.tsx`,
  `app/analysis/page.tsx` — read `fields` / `game` from context.
- `components/match-results.tsx`,
  `components/generator-components/generator-container/index.tsx`,
  `components/generator-components/generated-stats/index.tsx`,
  `components/generator-components/generator-controls/index.tsx`,
  `components/generator-components/generator-controls/accordion-items/gap-distribution.tsx`,
  `components/position-heat-map/index.tsx`,
  `components/analysis-components/{sum,cluster,last-digit,previous-draw-overlap,hot-cold-numbers,number-frequency,odd-even,gap,arithmetic-progression,top-numbers-per-position}*.tsx`
  — drop hard-coded counts; read from `useData().game`; bonus-aware
  copy.
- `hooks/use-saved-numbers.ts` — drop length-7 filter.
- `internal-docs/decisions.md` — appended ADR-009.
- `internal-docs/progress.md` — this entry.

### Verified
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npx vitest run` — 4 files, 45 tests, all pass (no behaviour
  changes to assertions).
- `npm run build` — production build succeeds, all 5 routes prerender
  as static. Local dev was not exercised in-browser this session
  because another `next dev` instance is already running on :3000;
  worth a click-through (Generate / Check Numbers / Analysis /
  Historical / About) before merging dev → main.

### Git State
- Branch `feat/game-abstraction` (off `dev`). About to commit, merge
  `--no-ff` into `dev`, delete the feat branch. Not pushed — user
  owns the push to `origin/dev`.

### Next
- Branch 2 — `feat/lottery-data-migration`: generalise
  `scripts/fetch-data.mjs` to a per-game fetcher driven by
  `GameConfig.dataSource`; add the four real CSVs from
  `national-lottery.co.uk`; output `public/data/{gameId}.json` per
  game; update the GH Actions workflow; register Lotto (real) as the
  first real game and retire the synthetic Merseyworld feed.

---


## Session: 2026-04-27 — Window filter on Historical matches card

### Completed
**Filter historical matches by time window**
- Added an All / Last 5 years / Last year toggle group to the
  "Historical matches" card on the home page so users can see how their
  generated combination would have matched within a recent window —
  not just across the full 30+ years of draws.
- Inlined the button group in the card header (top-right of the
  "Historical matches" title) rather than reusing the full
  `WindowFilter` component from the analysis page — that component
  includes a "Historical window" header, draw counts, and date range
  in its own bordered sub-container, all of which felt heavy for a
  card-level control. We still import `WINDOW_OPTIONS` and `WindowKey`
  from `window-filter.tsx` so the option set stays centralised.
- Filter state is local to the card (`useState<WindowKey>("all")`), not
  shared with the analysis page's URL-param window. Kept it local
  because the home page doesn't currently broadcast a window through
  context, and the match card is the only thing on that screen that
  cares — coupling them would be premature.
- Cutoff math mirrors `app/analysis/page.tsx`: `computeCutoff(years)`
  builds an ISO date N years ago, then we keep only draws with
  `dates[i] >= cutoff`. Filtered arrays (`windowedPast`,
  `windowedDates`) are passed into `countMatchesByTier`, so the tier
  counts and the popover date list both reflect the chosen window.
- Updated the popover sort/lookup to use `windowedDates`/`windowedPast`
  since `drawIndices` now index into the filtered arrays, not the full
  ones.

### Files Changed
- `components/match-results.tsx` — added inline window-toggle buttons in
  the card header + window state, filtered draws/dates by cutoff,
  swapped popover lookups to use the windowed arrays.

### Verified
- `npm run lint` clean, `npx tsc --noEmit` clean. Not verified in-browser
  this session — worth clicking through "All / Last 5 years / Last year"
  after generating a combination to confirm tier counts shrink as the
  window narrows and the popover still shows correct dates/numbers.

### Git State
- Branch `dev`. Committed on `feat/match-results-window-filter` as
  `839b384`, merged into `dev` as `d25c7e7` with `--no-ff`, feat branch
  deleted. Not pushed — user owns the push to `origin/dev`.

### Next
- Push `dev` (and `dev → main` when ready) at user's discretion.

---

## Session: 2026-04-27 — About page draft

### Completed
**About page content**
- Replaced the placeholder `app/about/page.tsx` (was just a stub returning
  `<div>AboutPage</div>`) with a server component laying out three Card
  sections matching the visual conventions of `/historical` and
  `/check-numbers` (same `text-2xl font-bold` h1, shadcn `Card`, default
  page padding inherited from `app/layout.tsx`).
- **What this app is** — frames the app as a UK Lotto / Hot Picks
  generator (5×1–50 + 2×1–11) that runs entirely client-side with no
  accounts/tracking/server.
- **How it works** — explains the historical analysis → threshold
  derivation → constraint-based rejection sampling pipeline at a
  non-technical level, and points users at `/check-numbers` and
  `/historical` for the adjacent flows.
- **What this app does NOT do** — direct disclaimer covering the
  gambler&rsquo;s fallacy (with Wikipedia link), equal probability of all
  combinations regardless of pattern, and the pari-mutuel sharing
  distinction (so users understand number choice can affect *payout
  share* in jackpot tiers but never *odds*). Card uses
  `border-destructive/40` to set it apart visually. Closes with a
  responsible-gambling note and a BeGambleAware link.
- Added `metadata` export so the tab title reads &ldquo;About — Lottery
  Number Generator&rdquo; instead of inheriting the root metadata.

### Files Changed
- `app/about/page.tsx` — replaced placeholder stub with full About page
  (server component, three Card sections, metadata export).

### Verified
- Not verified in-browser this session. No lint/typecheck run yet — page
  is a plain server component using existing `Card` primitive and only
  static JSX, so risk is low, but worth a `npm run lint` /
  `npx tsc --noEmit` before committing.

### Git State
- Working on `dev`; uncommitted. Per workflow memory, this is small
  enough to land directly on `dev` rather than a feature branch — user
  to confirm.

### Next
- User to review tone of the disclaimer (currently quite direct:
  &ldquo;It does not improve your odds. It cannot. Nothing can.&rdquo;)
  and decide whether to keep the BeGambleAware link, the
  `border-destructive/40` accent, and the destructive-card framing.
- Commit and push `dev` once approved.

---

## Session: 2026-04-27 — Help popovers on analysis cards

### Completed
**Per-card explainer popovers**
- New reusable `HelpPopover` (`components/ui/help-popover.tsx`) wrapping the
  existing Radix `Popover` with a `?` (lucide `HelpCircle`) trigger. Accepts
  a `title` and `ReactNode` body; popover is right-aligned, ~20 rem wide,
  capped to viewport.
- Added a HelpPopover to the top-right of every card on `/analysis` and to
  the heatmap card (which renders on `/` and `/analysis`):
  Heatmap, Overall number frequency, Most-drawn per sorted position, Sum
  of main numbers, Odd/even split, Gap distribution, Decade-band
  distribution, Last-digit distribution, Overlap with previous draw,
  Arithmetic progression (AP-3), Pair co-occurrence, Hot &amp; cold numbers.
  Each explains *what* the card shows and *why* it matters when picking
  numbers (links the analysis to the generator constraint or scoring
  knob it powers).
- Header pattern is consistent: each card&apos;s `<div className="flex flex-col gap-y-1">`
  title block is wrapped in `flex items-start justify-between gap-x-3` so
  the help button sits flush to the right edge. The heatmap card already
  had a flex-wrap header with a percent/count toggle; the title block was
  re-wrapped so the help button sits beside the title without disturbing
  the toggle.

### Files Changed
- `components/ui/help-popover.tsx` — new reusable popover trigger + content.
- `components/position-heat-map/index.tsx` — header re-shape, help popover.
- `components/analysis-components/number-frequency.tsx` — header + popover.
- `components/analysis-components/top-numbers-per-position.tsx` — header + popover.
- `components/analysis-components/sum-distribution.tsx` — header + popover.
- `components/analysis-components/odd-even-distribution.tsx` — header + popover.
- `components/analysis-components/gap-distribution.tsx` — header + popover.
- `components/analysis-components/cluster-distribution.tsx` — header + popover.
- `components/analysis-components/last-digit-distribution.tsx` — header + popover.
- `components/analysis-components/previous-draw-overlap.tsx` — header + popover.
- `components/analysis-components/arithmetic-progression-distribution.tsx` — header + popover.
- `components/analysis-components/pair-cooccurrence.tsx` — header + popover.
- `components/analysis-components/hot-cold-numbers.tsx` — header + popover.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- UI not exercised in browser this session.

### Git State
- Working on `dev`; nothing committed yet.

### Next
- Manual visual sweep to confirm the help button doesn&apos;t crowd the
  long titles on narrow viewports.

---

## Session: 2026-04-27 — Hot/cold rolling-window bias (`feat/hot-cold-window`)

### Completed
**Recent-frequency biasing for the generator**
- Added `recentWindowSize` (default 50) and `recentBias` (default 0,
  i.e. off) to `GenerateValidNumberSetOptions`. When both > 0 and there
  are draws to slice, the generator builds a recent-only positional
  counter from `lotteryNumbers.slice(0, recentWindowSize)` and blends a
  recent-frequency score into the positional score:
  `positionBlended = (1 - recentBias) * allTimeScore + recentBias * recentScore`.
- The pair-cohesion blend is layered over `positionBlended`, so both
  knobs compose. `bestRecentScore` is reported on the result alongside
  `bestScore` and `bestPairScore`.
- New "Recent-Frequency Bias" accordion item in `GeneratorControls`
  with two inputs (window size and bias %). The trigger row reads
  "off" when bias = 0 to make the disabled state unambiguous.
- Generator footer (in `GeneratorContainer`) shows the recent-frequency
  score only when active.
- New `HotColdNumbers` analysis card on `/analysis` (after
  PairCoOccurrence). Standalone window selector defaults to 50 (or
  fewer if history is short). Shows hottest / coldest 8 numbers, a
  full-50 grid of recent-vs-all-time delta tiles colored by direction,
  and the recent mean rate alongside the 10 % expected baseline for
  5/50 main draws.

### Files Changed
- `lib/generator/types.ts` — `recentWindowSize`, `recentBias`, `bestRecentScore`.
- `lib/generator/constants.ts` — defaults (50 / 0).
- `lib/generator/generate-numbers/index.ts` — recent counter build, score blend.
- `components/generator-components/generator-controls/accordion-items/recent-bias.tsx` — new.
- `components/generator-components/generator-controls/accordion-items/index.tsx` — barrel export.
- `components/generator-components/generator-controls/index.tsx` — accordion entry.
- `components/generator-components/generator-container/index.tsx` — recent-score footer row.
- `components/analysis-components/hot-cold-numbers.tsx` — new card with internal window state.
- `app/analysis/page.tsx` — render the new card.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- UI not exercised in browser this session (existing dev server held the lock).

### Git State
- Branch `feat/hot-cold-window` merged into `dev` as `--no-ff`; branch deleted locally. Nothing pushed.

### Next
- All three brainstorm tactics from this session are implemented (AP-3, pair co-occurrence, hot/cold). User should drive when to push `dev → main`.

---

## Session: 2026-04-27 — Pair co-occurrence score (`feat/pair-cooccurrence`)

### Completed
**50×50 pair co-occurrence with optional scoring blend**
- `ThresholdCriteria.analyzePairCoOccurrence` builds a
  `Record<string, number>` keyed `"a,b"` (a < b) of how many historical
  draws contain that main-number pair. Stores `pairCounts`,
  `meanPairCount`, `drawsAnalysed` on the instance. C(50,2) = 1225
  potential pairs, all with positive expected count, so the map is
  small and stable.
- Generator threads optional precomputed `pairCounts` (4th arg). Per
  accepted set, computes a pair score = mean per-pair count over the
  C(5,2) = 10 main pairs, scaled to %. Blends with the positional
  score using `pairScoreWeight` (0..1, default 0). When weight = 0
  behavior is unchanged.
- Result type gains `bestPairScore`. Worker / `useGenerator` /
  `app/page.tsx` updated to forward `analysis.pairCoOccurrenceData.pairCounts`.
- New "Pair-Score Weight" accordion item that takes a 0..100 % input
  and stores 0..1 in genOptions. Pattern follows OddEvenDistItem
  (uses `updateOptions` directly rather than the numeric
  handleInputChange).
- Set Characteristics card adds a "Pair cohesion" row showing the set's
  cohesion score against the historical mean, with green/amber state.
- Generator footer adds a "Pair-cohesion score" line.
- New `PairCoOccurrence` analysis card on `/analysis` (after AP-3)
  showing the top 12 hottest pairs as horizontal bars and a bucketed
  pair-count distribution, plus mean co-occurrence per pair.

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — pair analysis & instance field.
- `lib/generator/types.ts` — `pairScoreWeight`, `bestPairScore`.
- `lib/generator/constants.ts` — default 0.
- `lib/generator/generate-numbers/index.ts` — pair counter build, score blend.
- `workers/generateNumbers.worker.ts` — accept `pairCounts`.
- `hooks/use-generator.ts` — accept and forward `pairCounts`.
- `app/page.tsx` — pass `pairCounts` and `pairData` props.
- `components/generator-components/generated-stats/index.tsx` — Pair cohesion row.
- `components/generator-components/generator-container/index.tsx` — Pair-cohesion footer.
- `components/generator-components/generator-controls/accordion-items/pair-score-weight.tsx` — new.
- `components/generator-components/generator-controls/accordion-items/index.tsx` — barrel.
- `components/generator-components/generator-controls/index.tsx` — accordion entry.
- `components/analysis-components/pair-cooccurrence.tsx` — new card.
- `app/analysis/page.tsx` — render the new card.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- UI not exercised in browser this session.

### Git State
- Branch `feat/pair-cooccurrence` merged into `dev` as `--no-ff`; branch deleted locally. Nothing pushed.

### Next
- Move on to option 2 (hot/cold rolling-window).

---

## Session: 2026-04-27 — AP-3 reject (`feat/ap3-reject`)

### Completed
**Arithmetic-progression length-3 reject (d ≥ 2)**
- Added `containsArithmeticProgression(nums, length=3, minDiff=2)` util
  in `lib/generator/generate-numbers/utils.ts`. O(n²) sweep over sorted
  unique numbers, checking if `a + 2d` is also in the set for each pair
  with d ≥ minDiff. minDiff=2 because d=1 is already covered by the
  consecutive-run rule.
- New `mainRules` entry rejects with reason `arithmetic_progression`.
  Added that key to `RejectionCounts` and `emptyRejectionCounts`. No UI
  control — same shape as the consecutive-run rule (hard reject, not
  user-tunable).
- `ThresholdCriteria.analyzeArithmeticProgressionDistribution` walks
  every historical draw, recording draws containing at least one AP-3
  (with d ≥ 2) overall and per common-difference d. Stored on instance
  as `arithmeticProgressionData`.
- New analysis card `ArithmeticProgressionDistribution` rendered on
  `/analysis` (after PreviousDrawOverlap), showing per-d frequency bars
  and the overall draws-containing-AP-3 percentage.
- Set Characteristics card on home now shows an "Arithmetic
  progression" row with d when present, and a colored ok/violated
  status. Hard reject means the row will normally read "no AP-3" for
  generated sets but provides verification.

### Files Changed
- `lib/generator/generate-numbers/utils.ts` — `containsArithmeticProgression` util.
- `lib/generator/generate-numbers/rules.ts` — new mainRule entry.
- `lib/generator/types.ts` — `arithmetic_progression` in `RejectionCounts`.
- `lib/generator/generate-numbers/index.ts` — counter init.
- `lib/generator/threshold-criteria/index.ts` — `analyzeArithmeticProgressionDistribution`, instance field.
- `components/analysis-components/arithmetic-progression-distribution.tsx` — new card.
- `app/analysis/page.tsx` — render the new card.
- `components/generator-components/generated-stats/index.tsx` — AP-3 row.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Not exercised in browser yet.

### Git State
- Branch `feat/ap3-reject` merged into `dev` as `--no-ff`; branch deleted locally. Nothing pushed.

### Next
- Move on to option 1 (pair / triplet co-occurrence) per session plan.

---

## Session: 2026-04-27 — Previous-draw overlap constraint (`feat/previous-draw-overlap`)

### Completed
**Repeat-from-previous-draw count, end-to-end**
- `ThresholdCriteria.analyzePreviousDrawOverlap` walks every consecutive
  draw pair in `lotteryNumbers`, counts how many mains are shared, and
  derives the 95th-percentile cap as `maxPreviousDrawOverlap`. Stores the
  full overlap distribution (0..5) and pair count on the instance.
- `RuleOptions` extended from a pure `Pick<>` to also carry runtime data
  via `previousDrawMain: number[]`. New rule rejects sets where the
  overlap with `lotteryNumbers[0]`'s mains exceeds the cap. Empty
  `previousDrawMain` is a no-op (e.g. cold start with no history).
- Wired `maxPreviousDrawOverlap` through `GenerateValidNumberSetOptions`,
  `RejectionCounts.previous_draw_overlap`, default in `DEFAULT_OPTIONS`
  (2), and seed from `analysis.maxPreviousDrawOverlap` in
  `useDataProvider`.
- New analysis card `PreviousDrawOverlap`: horizontal histogram of
  overlap counts (0..5) with the cap line + within-cap percentage.
- Home `GeneratedStats` Set Characteristics card: new "Overlap w/ previous
  draw" row, conditional on `previousDraw` being available; `app/page.tsx`
  passes `pastNumbers[0]` through.
- `GeneratorControls`: new `PreviousDrawOverlapItem` accordion entry
  bound to `maxPreviousDrawOverlap`.

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — analyzePreviousDrawOverlap
  + new fields.
- `lib/generator/types.ts` — `RejectionCounts.previous_draw_overlap`,
  `GenerateValidNumberSetOptions.maxPreviousDrawOverlap`.
- `lib/generator/constants.ts` — `maxPreviousDrawOverlap: 2` default.
- `lib/generator/generate-numbers/rules.ts` — `RuleOptions` now intersects
  a `previousDrawMain: number[]` runtime field; new mainRule.
- `lib/generator/generate-numbers/index.ts` — derive `previousDrawMain`
  from `lotteryNumbers[0]`, wire option + rejection key.
- `context/useDataProvider.tsx` — seed `maxPreviousDrawOverlap`.
- `components/analysis-components/previous-draw-overlap.tsx` — new card.
- `app/analysis/page.tsx` — render the new card.
- `app/page.tsx` — pass `pastNumbers[0]` to GeneratedStats.
- `components/generator-components/generated-stats/index.tsx` — overlap
  computation + new dl row + previousDraw prop.
- `components/generator-components/generator-controls/accordion-items/previous-draw-overlap.tsx`
  — new control.
- `components/generator-components/generator-controls/accordion-items/index.tsx`
  — barrel export.
- `components/generator-components/generator-controls/index.tsx` — new
  accordion entry.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Browser-side UI verification deferred to the user's running dev server.

### Git State
- Branched `feat/previous-draw-overlap` off `dev`.

### Next
- Pair / triplet co-occurrence — bigger lift; needs a 50×50 matrix on
  `ThresholdCriteria` and a scoring tweak rather than a hard reject.
- Or arithmetic-progression reject (AP-3) — tiny add, mirrors the
  consecutive-run rule.

---

## Session: 2026-04-27 — Last-digit control accordion item (`feat/last-digit-control`)

### Completed
**Tunable `maxSameLastDigit` from the home Controls card**
- New `LastDigitItem` accordion content
  (`components/generator-components/generator-controls/accordion-items/last-digit.tsx`)
  with a numeric input (1–5) bound to `maxSameLastDigit`. Mirrors the
  shape of `ClusterMaxItem`.
- Wired into `GeneratorControls`: new accordion item between
  `cluster-max` and `odd-even-dist` with a `TriggerRow` showing the
  current cap value. Re-exported from the accordion-items barrel.

### Files Changed
- `components/generator-components/generator-controls/accordion-items/last-digit.tsx` — new.
- `components/generator-components/generator-controls/accordion-items/index.tsx` — barrel export.
- `components/generator-components/generator-controls/index.tsx` — import + new accordion item.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.

### Git State
- Branched `feat/last-digit-control` off `dev`.

### Next
- Repeat-from-previous-draw count (next brainstorm tactic) — needs
  the prior draw threaded into the worker. Consider whether to model
  it as a hard reject (overlap > N) or a score nudge.

---

## Session: 2026-04-27 — Last-digit spread constraint (`feat/last-digit-spread`)

### Completed
**Last-digit spread end-to-end**
- `ThresholdCriteria.analyzeLastDigitDistribution` (mainOnly, percentile=95):
  per-draw computes how many mains share a last digit; tracks per-digit
  totals (0–9) and a distribution of "max same-last-digit count per
  draw". 95th percentile of that max becomes `maxSameLastDigit` (≥1).
  Stored on the instance as `lastDigitDistributionData` +
  `maxSameLastDigit`.
- New generator constraint: `mainRules` now rejects sets where
  `maxSameLastDigitCount(nums) > maxSameLastDigit` with rejection key
  `last_digit_repeat`. New util `maxSameLastDigitCount` in
  `generate-numbers/utils.ts`.
- Wired through types: `GenerateValidNumberSetOptions.maxSameLastDigit`,
  `RejectionCounts.last_digit_repeat`, `RuleOptions` Pick, default in
  `DEFAULT_OPTIONS` (3), seeded from `analysis.maxSameLastDigit` in
  `useDataProvider.tsx`.
- New analysis card
  `components/analysis-components/last-digit-distribution.tsx`:
  - 0–9 bar chart of total occurrences across mains, summed over draws
    (uniformity check).
  - Horizontal histogram of "max same-last-digit per draw" (1–5),
    highlighting bars at or under the cap; sky for in-band, muted
    otherwise.
  - Footer dl: total draws + "% within cap".
- New row in home `GeneratedStats` Set Characteristics card: "Max same
  last digit" — value, parenthetical digit when ≥2 share, and an in/out
  marker against `genOptions.maxSameLastDigit`.

### Files Changed
- `lib/generator/threshold-criteria/index.ts` — analyzeLastDigitDistribution
  method; new fields `lastDigitDistributionData`, `maxSameLastDigit`;
  invoked from constructor.
- `lib/generator/types.ts` — `RejectionCounts.last_digit_repeat`;
  `GenerateValidNumberSetOptions.maxSameLastDigit`.
- `lib/generator/constants.ts` — `maxSameLastDigit: 3` default.
- `lib/generator/generate-numbers/utils.ts` — `maxSameLastDigitCount`.
- `lib/generator/generate-numbers/rules.ts` — new `mainRules` entry,
  `RuleOptions` Pick extended.
- `lib/generator/generate-numbers/index.ts` — `emptyRejectionCounts`,
  destructured option default, `ruleOpts` field.
- `context/useDataProvider.tsx` — `seededOptions.maxSameLastDigit` from
  analysis.
- `components/analysis-components/last-digit-distribution.tsx` — new card.
- `app/analysis/page.tsx` — import + render `LastDigitDistribution`.
- `components/generator-components/generated-stats/index.tsx` — last-digit
  row in Set Characteristics dl.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Browser-side UI verification deferred to the user's running dev server.

### Git State
- Branched `feat/last-digit-spread` off `dev`.

### Next
- No `GeneratorControls` accordion entry for `maxSameLastDigit` yet —
  the value is seeded from history but cannot be tuned in the UI. If
  desired, add an accordion item alongside `ClusterMaxItem` (small
  slider 1–5).
- Next tactic from the brainstorm list: repeat-from-previous-draw
  count, which needs the prior draw threaded into the worker.

---

## Session: 2026-04-27 — Decade-band distribution analysis card (`feat/cluster-distribution-analysis`)

### Completed
**Decade-band distribution on `/analysis`**
- New `ClusterDistribution` component
  (`components/analysis-components/cluster-distribution.tsx`) surfaces the
  historical view of what the existing `clusterMax` / `clusterGroupSize` rule
  constrains. Two views in one card:
  - **Mean numbers per band** — bar per band (1–10, 11–20, …, 41–50) with
    average count of mains per draw on the y-axis. Surfaces whether bands
    are uniform or skewed.
  - **Max single-band fill per draw** — horizontal histogram of "the largest
    number of mains in any single band, per draw" (1, 2, 3, 4, 5). Bars at
    or below `clusterMax` (default 3) render in sky; bars above render
    muted. Footer dl shows total draws + "% within cap".
- Computed inline from the windowed `pastNumbers` so it reflects the active
  `WindowFilter` selection, matching how `SumDistribution` works. No
  changes to `ThresholdCriteria`, generator rules, or `genOptions`.
- Decision rationale: while exploring the user's request to add "decade
  coverage" to the generator, discovered `clusterMax` / `clusterGroupSize`
  already implement that constraint — but `/analysis` had no
  visualisation of it (unlike sum / odd-even / gap, which all have cards).
  This card closes that asymmetry without duplicating the rule.

### Files Changed
- `components/analysis-components/cluster-distribution.tsx` — new component.
- `app/analysis/page.tsx` — import + render `ClusterDistribution` after
  `GapDistribution` in the windowed-analysis section.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Browser-side UI verification deferred to the user's running dev server.

### Git State
- Not yet committed; branched off `dev` per workflow memory.

### Next
- Last-digit spread is the next genuinely new tactic from the brainstorm
  list (decade coverage is already in via cluster rule). Will be a full
  end-to-end add: `ThresholdCriteria` analysis → generator rule + option →
  analysis card → row in home Set Characteristics.

---

## Session: 2026-04-27 — Generated set characteristics + 2x2 home grid (`feat/generated-stats`)

### Completed
**Stats card under generated numbers**
- New `GeneratedStats` component (`components/generator-components/generated-stats/index.tsx`)
  surfaces five views of the just-generated set against the live `genOptions`
  thresholds:
  - Per-position frequency bars (Main 1–5 sky, Lucky 1–2 amber) using
    `bestPatternProb`.
  - Sum of mains vs. `[sumMin, sumMax]` band.
  - Odd/even split vs. `oddRange`.
  - Max consecutive gap (main + lucky) vs. `maxMainGapThreshold` /
    `maxLuckyGapThreshold`.
  - Per-cluster bar chart of mains across `[1..maxMain]` in
    `clusterGroupSize` buckets, with the per-group cap called out.
- Each row tags whether the value sits inside the band; in-band values render
  emerald, out-of-band amber. Cluster bars flip amber if any group exceeds
  `clusterMax`.
- Stats are `useMemo`-derived from the combination + `genOptions` only — no
  changes to the worker, the rules, or `ThresholdCriteria`.

**2x2 home grid**
- Lifted worker + result state out of `GeneratorContainer` into a new
  `useGenerator` hook (`hooks/use-generator.ts`). `GeneratorContainer` is now
  a presentational Generate-card that takes `{ isGenerating, results,
  durationMs, onGenerate }` as props.
- `app/page.tsx` orchestrates a 2-col grid of four equal sibling cards:
  Generate · Controls (row 1) and MatchResults · GeneratedStats (row 2).
  When no combination has been generated, only the top row renders.
- Added `h-full` to each card's outer wrapper so siblings in the same row
  stretch to match. Also pinned the meta `<dl>` in the Generate card to the
  bottom with `mt-auto` so the result block aligns nicely against
  Controls' accordion height.

### Files Changed
- `components/generator-components/generated-stats/index.tsx` — new component;
  `h-full` on outer Card.
- `hooks/use-generator.ts` — new hook owning the worker, results, timer, and
  toast on failure.
- `components/generator-components/generator-container/index.tsx` — stripped
  to a presentational Generate card; took props instead of owning state;
  `h-full` on Card; `mt-auto` on meta `<dl>`.
- `components/generator-components/generator-controls/index.tsx` — `h-full`
  on outer Card.
- `components/match-results.tsx` — `h-full` on outer Card.
- `app/page.tsx` — uses `useGenerator`; renders all four cards as siblings in
  one grid; conditionally renders the bottom row.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Browser-side UI verification deferred to the user's running dev server.

### Git State
- Stats card committed as `1681ae8` and merged into `dev` as `a1ae26f`
  (`--no-ff`). 2x2 grid follow-up committed as `420888d` and merged into
  `dev` as `224c2b4` (`--no-ff`). Branch deleted locally.

### Next
- Awaiting user feedback on the grid layout. Possible polish: when only
  Generate + Controls render (pre-generation), centre the row or constrain
  width so the cards don't go full-bleed at md+.

---

## Session: 2026-04-27 — Historical window filter (`feat/historical-window-filter`)

### Completed
**Per-window analysis on `/analysis`**
- New `WindowFilter` component (`components/analysis-components/window-filter.tsx`):
  three-option button group ("All time", "Last 5 years", "Last year") plus
  a header line showing "X of Y draws · {start} – {end}". Selection is
  persisted in a `?window=` URL search param so refresh + share work.
- `app/analysis/page.tsx` reads the param, slices `pastNumbers`/`dates` to
  the cutoff (lexical compare against `YYYY-MM-DD`), and instantiates a
  fresh `ThresholdCriteria` from the slice via `useMemo`. The full-history
  `ThresholdCriteria` from `DataProvider` is left untouched so the
  generator's defaults stay rooted in full history.
- Page wraps its content in `<Suspense fallback={null}>` because Next.js 16
  requires a Suspense boundary around `useSearchParams()`.
- Empty-window guard renders "The selected window contains no draws."
  rather than crashing the constructor.
- Copy in `SumDistribution`, `OddEvenDistribution`, and `GapDistribution`
  reworded from "the generator's defaults" / "generator targets" to
  window-neutral phrasing — the bands now reflect the windowed slice's own
  15/85th and 95th percentiles, which is what the chart is actually showing.

### Files Changed
- `components/analysis-components/window-filter.tsx` — new (button group +
  range caption + `WindowKey` type guard).
- `app/analysis/page.tsx` — wraps content in Suspense, reads
  `?window=` param, builds windowed `ThresholdCriteria`, passes
  windowed analysis + slice to all sections.
- `components/analysis-components/sum-distribution.tsx` — copy + dl label
  reworded; no logic change.
- `components/analysis-components/odd-even-distribution.tsx` — copy
  reworded; no logic change.
- `components/analysis-components/gap-distribution.tsx` — copy reworded;
  no logic change.
- `internal-docs/decisions.md` — ADR-003.
- `internal-docs/future-ideas.md` — flipped the window-filter entry to
  Implemented; custom-range + extra presets remain open as a follow-up.

### Verified
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Browser-side UI verification deferred to the user's running dev server.

### Git State
- Branch `feat/historical-window-filter` off `dev`; commit + merge into
  `dev` pending until the user has eyeballed it.

### Next
- After merge, the natural follow-ups are (a) more analysis sections
  (consecutive runs, high/low + decade split, multiples-of-N) and (b)
  custom-range / "Last 6 months" presets on the window filter.

---

## Session: 2026-04-27 — Generator match list + Analysis page (`feat/generator-matches-and-analysis-page`)

### Completed
**Heatmap card-wrap (post-review polish)**
- `components/position-heat-map/index.tsx` swapped its outer `<section>` for
  the same `<Card className="flex flex-col gap-y-3 p-4 w-full">` shell the
  three new analysis components use, so all six cards on `/analysis` share
  one visual rhythm.

**Two more analysis sections**
- `GapDistribution` — bar chart of main + lucky gap sizes between consecutive
  sorted numbers, summed across position-pairs from
  `analysis.gapDistributionData`. Bars at or below the generator's 95th-
  percentile thresholds (`maxMainGapThreshold`, `maxLuckyGapThreshold`) are
  highlighted; threshold value is also called out in the per-group header.
- `NumberFrequency` — overall frequency of each number in any main slot
  (1–50) and any lucky slot (1–11), derived by summing the relevant
  `positionCounters` slices. Top 5 per group are highlighted, giving a
  position-agnostic counterpart to the per-sorted-position heatmap.
- `app/analysis/page.tsx` ordering reshuffled to group "per-number" lenses
  (heatmap → overall frequency → top-per-position) ahead of aggregate-stat
  lenses (sum → odd/even → gap).

**Pattern matches under the generator**
- `GeneratorContainer` now renders `<MatchResults>` directly below the result
  card whenever `combination` is set. Reuses the same component as
  `/check-numbers` so the popover-with-historical-draws UX is identical
  (date + ball row with matched numbers highlighted).
- The container's outer wrapper changed from a single `<Card>` to a
  `<div className="flex flex-col gap-y-4">` containing the generator card +
  the matches card so they stack visually but stay independent.

**New `/analysis` route**
- Added `app/analysis/page.tsx` with the moved `Heatmap` plus three new
  components in `components/analysis-components/`:
  - `SumDistribution` — 10-wide buckets of historical main-number sums,
    bars highlighted if they fall inside the generator's 15th–85th band;
    captioned with mean/median/draws.
  - `OddEvenDistribution` — horizontal bars driven by the existing
    `analysis.distribution`; rows inside the generator's chosen `oddRange`
    are highlighted.
  - `TopNumbersPerPosition` — top 5 numbers per sorted draw position with
    percentages, sourced from `analysis.positionCounters`.
- Removed the heatmap from `app/page.tsx` and added `items-start` to the
  generator/controls grid so the now-taller left column doesn't stretch the
  controls card.
- Added an "Analysis" link to `Navbar` between Check Numbers and Historical.

### Files Changed
- `components/generator-components/generator-container/index.tsx` — wraps in
  outer `div`, mounts `MatchResults` below the result card.
- `components/analysis-components/sum-distribution.tsx` — new.
- `components/analysis-components/odd-even-distribution.tsx` — new.
- `components/analysis-components/top-numbers-per-position.tsx` — new.
- `app/analysis/page.tsx` — new.
- `app/page.tsx` — drop `Heatmap` import + render; add `items-start` to the
  generator/controls grid.
- `components/nav.tsx` — add `/analysis` nav item.
- `internal-docs/decisions.md` — ADR-002 covering the page split.
- `internal-docs/future-ideas.md` — historical window filter (high
  priority) + more-sections backlog under a new "Analysis page" group.

### Verified
- Not verified yet — `npm run lint` and a manual dev-server pass are
  pending.

### Git State
- Branch `feat/generator-matches-and-analysis-page` off `dev`; not committed
  or pushed yet.

### Next
- Run lint + dev server, fix anything that surfaces, commit, hand off `git push`.
- After merge, the historical window filter is the natural next branch.

---

## Session: 2026-04-27 — Home page UI/UX pass (`feat/home-ui-polish`)

### Completed
**Generator result card — lottery balls + button states**
- Generated numbers now render as circular tokens with a visible divider between
  the 5 main and 2 lucky positions; main = sky, lucky = amber, dark-mode aware.
- Per-number Radix tooltips replace the native `title` attribute and show
  position label + pattern probability.
- Generate button is disabled while running, swaps to "Generating…" with an
  inline spinner, and switches to "Generate again" once a result exists. Empty
  state gets a one-line hint.
- Added `sr-only` `aria-live="polite"` region announcing generation start /
  completed numbers.
- Save and Copy icon buttons swapped to shadcn `Tooltip` + explicit
  `aria-label`s.
- Stats moved out of `<Label>` into a `<dl>` with `tabular-nums`.

**Controls — value summaries on triggers**
- Each `AccordionTrigger` now shows the current value(s) on the right
  (iterations, score%, sum range, cluster max, odd range, gap thresholds) so
  users can scan settings without expanding any panel.

**Odd/Even — explicit Min/Max inputs**
- Replaced the implicit "row above middle = min, row below = max" click
  behaviour with two number inputs bounded `[0, distribution.length-1]`.
- The table is read-only; every row whose `oddCount` falls within the selected
  range is highlighted (not just the two endpoints), so users can see the
  range coverage at a glance.

**Heatmap — legend + count/percentage toggle**
- Wrapper now owns `usePct` state; surfaces a Percentage / Count toggle group
  (`aria-pressed`) and a small low→high gradient legend below the grids.
- Caption clarifies that positions are sorted before display.

**Header — data freshness**
- Home page header gets "Historical data updated <date>" sourced from
  `useData().updatedAt`, formatted via `Intl.DateTimeFormat` and wrapped in
  `<time>`.

### Files Changed
- `components/ui/tooltip.tsx` — new shadcn wrapper around `@radix-ui/react-tooltip`
- `components/generator-components/generator-container/index.tsx` — full
  rewrite of result presentation (balls, tooltips, button states, aria-live,
  empty state, dl stats)
- `components/generator-components/generator-controls/index.tsx` — `TriggerRow`
  helper for label+value summaries on each accordion header
- `components/generator-components/generator-controls/accordion-items/odd-even-dist.tsx`
  — explicit Min/Max number inputs; table becomes read-only with range
  highlight
- `components/position-heat-map/index.tsx` — `usePct` state, toggle group,
  gradient legend, caption
- `components/copy-to-clipboard-button.tsx` — wrapped in shadcn `Tooltip`,
  given an `aria-label`, switched to `variant="outline"`/`size="icon"`
- `app/page.tsx` — header layout updated to surface `updatedAt`
- `package.json` / `package-lock.json` — `@radix-ui/react-tooltip` added
- `internal-docs/decisions.md` — created with ADR-001 (tooltip primitive choice)
- `internal-docs/future-ideas.md` — created with backlog items surfaced by the
  critique that were *not* implemented this pass (reset-to-defaults, modified
  indicator, plain-language labels, live qualify-count preview, onboarding
  link, heatmap drill-down)
- `app/layout.tsx` — pre-existing unstaged spacing tweak (smaller `py-*`)
  carried into this branch

### Verified
- `npm run lint` clean.
- `npm run build` succeeds (TypeScript pass, all 5 routes prerender static).
- Browser verification not performed by Claude — owner should `npm run dev`
  and check: ball rendering / dark mode, button states during a long
  generation, tooltips on touch and keyboard focus, the odd/even highlight
  range, heatmap toggle, and updatedAt date format.

**Follow-up — divider spacing fix**
- The vertical divider between main and lucky balls had its own `mx-1` while
  also inheriting the `<ol>`'s `gap-x-2`, producing 12px on its left vs 4px on
  its right. Hoisted the divider into its own `<li>` so the gap utility
  applies symmetrically (8px on both sides). Now its own commit.

### Git State
- Branch: `feat/home-ui-polish` — two commits off `dev` (`4b0164f`):
  - `912493e` feat(home): polish generator card, controls, and heatmap UX
  - `54e860a` fix(home): even spacing around main/lucky divider
- Merged into `dev` as `e91dfb9` with `--no-ff`; the unstaged `app/layout.tsx`
  spacing tweak was stashed for the checkout and restored after the merge.

### Next
- Owner-driven browser verification on the merged `dev`.
- Optionally pull from `internal-docs/future-ideas.md` for the next pass.

---

## Session: 2026-04-27 — `dev` work landed via merge commits

### `feat/saved-numbers` → merged into `dev` as `f230b74`

Three commits:

- `96e50e8` feat: save generated numbers to localStorage and surface on check page
- `f434acb` feat(saved): toggle bookmark button to reflect saved state
- `c65e71f` feat(saved): click a saved set to load it into the check form

Behaviour:
- New `hooks/use-saved-numbers.ts` exposes `{ list, add, remove, hydrated }` over `localStorage["saved-numbers-v1"]`. Initial design used per-instance React state; **see the next branch for the bug that produced and the fix.**
- Bookmark button on `GeneratorContainer` saves/unsaves the current generated tuple. Filled `BookmarkCheck` icon + `default` button variant when the displayed result is already in storage; clicking again removes.
- `components/saved-sets-list.tsx` lists saved entries with an exact-match badge against the historical draws and a remove button. `onSelect` callback lets a parent populate a form with the clicked tuple.
- The Check Numbers form was switched to controlled inputs so the saved-set click can populate it. `<input type="reset">` Clear button replaced with an explicit state-reset button.

### `feat/match-results` → merged into `dev` as `4b0164f`

Eight commits, summarized:

- `f879a44` feat(check): live prize-tier match counts beside the number form — new `lib/lottery-match.ts` (set-based, 9 canonical tiers from 5+2 down to 3+1) plus `components/match-results.tsx`. Top of the page becomes a 2-col grid; old "Check" submit button removed since results are live; toast-on-submit dropped.
- `7a3b701` feat(check): save typed numbers as a new tracked set — Save/Saved toggle next to Clear on the form.
- `d6374d7` fix: cross-instance saved-numbers sync + theme-toggle hydration — **important fix.** `useSavedNumbers` rewritten as a module-level store via `useSyncExternalStore` so every consumer reads the same list and updates land everywhere immediately (was a real bug where saving from the form didn't update the saved-sets card alongside it). Also fixed a hydration mismatch on `ThemeToggle` by switching from `if (!resolvedTheme)` to a post-mount `mounted` flag — `next-themes` resolves synchronously via an inlined script so the client's first render had the real theme while SSR rendered the placeholder.
- `aed6f17` fix(check): keep top row width stable across renders — single-class fix, added `w-full` to the top grid so it doesn't shrink to its content as MatchResults populates.
- `bda6d18` refactor(check): two-column layout with saved sets in the right column — outer `grid-cols-2 items-start`, left column stacks form + match results, right column hosts the saved-sets card. Each card owns its own `h3` heading.
- `3e920f3` feat(check): smart-paste distributes pasted numbers across inputs — `onPaste` handler splits clipboard text on whitespace/commas, drops non-digit tokens (so an ISO date pasted from the historical table is ignored), distributes across consecutive inputs starting from the focused one.
- `f695c4b` feat(check): popover lists draw dates per match tier — added `@radix-ui/react-popover` + standard shadcn `components/ui/popover.tsx`. `countMatchesByTier` extended to return `drawIndices: number[]` so the component can map back to dates without re-scanning history. New unit test guards the index ordering. 45 tests passing.
- `d542bb8` feat(check): popover shows full draw with matched numbers highlighted — each entry now shows the date + the seven-number draw as monospace chips, with matched numbers in emerald and others muted. Position governs which user-set to test against.

### Files of note added
- `hooks/use-saved-numbers.ts` — module-level external store for saved sets
- `components/saved-sets-list.tsx` — list with match badges, remove, optional onSelect
- `components/match-results.tsx` — live prize-tier breakdown + popover detail
- `lib/lottery-match.ts` — pure helper, returns `MatchTier[]` with `drawIndices`
- `lib/lottery-match.test.ts` — 7 tests
- `components/ui/popover.tsx` — shadcn wrapper around Radix popover

## Final state

```
main (f144e3a) — 11 commits ahead of origin/main
```

Merge order taken (each as `--no-ff` except 4 which fast-forwarded):
1. `refactor/generator-rules` → main (FF — bundled branches 1, 3, the .gitignore commit, and 4)
2. `feat/dual-heatmap` → main (clean)
3. `chore/types-and-ui-polish` → main (conflicts on `app/page.tsx`, `lib/generator/index.ts`)
4. `chore/static-data-import` → main (conflicts on `useDataProvider.tsx`, `GeneratorContainer`, `app/check-numbers/page.tsx`; removed dead loading/error/refresh from `app/page.tsx` since the static import made them unreachable)

All six feature branches deleted locally after merge. **Not pushed.** Run `git push origin main` to ship.

## Pre-merge branch graph (historical)

```
main (04718a7)
├── fix/generator-correctness         (b4e9bc1)
│   └── test/generator-helpers        (1a6d780)
│       └── refactor/generator-rules  (a34ec2b)
│           └── chore: ignore internal-docs (81a8a3c)
├── chore/types-and-ui-polish         (3fcd200)
├── feat/dual-heatmap                 (c66a6e4)
└── chore/static-data-import          (185624c)
```

`chore/types-and-ui-polish` was a sibling of `fix/generator-correctness`, not stacked on it. The test branch sat on top of the fix branch so the new tests could verify post-fix behaviour. The refactor branch sat on top of the test branch so the tests guarded the refactor.

## Completed branches

### `main` — `04718a7` docs: add CLAUDE.md
- Initial guidance file: commands, architecture (data flow, generator core, worker, UI stack), conventions.
- Notes that lottery numbers are zero-padded strings, first 5 = main, last 2 = lucky.
- 1 commit ahead of `origin/main` (not pushed).

### `fix/generator-correctness` — `b4e9bc1` fix(generator): correctness fixes for 4 latent bugs
Off `main`. Critique items #1, #2, #3, #4.

- **Bug 1 — `bestPatternProb` updated out of sync with `bestCombination`.** Moved the assignment inside the `if (avgScore > bestScore)` block in `lib/generator/generate-numbers/index.ts` so the three "best" fields move together. Also added the missing `triedCombinedCombinations.add(combinedKey)` on the success path.
- **Bug 2 — `special_1` and `special_2` produced the same average.** Rewrote `lib/generator/generate-pattern-probs.ts` with a `pickPatternProbs(probs, pattern)` helper. `special_1` now picks `probs[5]` (L1), `special_2` picks `probs[6]` (L2).
- **Bug 3 — worker had no error path.** Rewrote `workers/generateNumbers.worker.ts` to use a discriminated `WorkerResponse` union (`{ ok: true, res } | { ok: false, error }`) and try/catch around the call.
  - `components/generator-components/generator-container/index.tsx` now imports `WorkerResponse`, swaps `alert("Generation failed")` for `toast.error(...)`, and shares a `finishTimer()` helper across both paths.
- **Bug 4 — module-level `iterationCheckDict` singleton.** Replaced with a per-call `rejections = emptyRejectionCounts()` returned on the result. New `RejectionCounts` interface and `rejections` field on `GenerateValidNumberSetResult` in `lib/generator/types.ts`. Deleted `lib/generator/generate-numbers/constants.ts` (held the obsolete singleton). Exported `RejectionCounts` from `lib/generator/index.ts`.
- **#18 — gated outer `console.log`s** behind a `debug` flag (side effect of the rewrite).

### `chore/types-and-ui-polish` — `3fcd200` chore: tighten types and polish UI surface
Off `main` (sibling of fix branch). Critique items #6–#9, #17, #20.

- Added `UpdateOptions` generic type in `lib/generator/types.ts`:
  ```ts
  export type UpdateOptions = <K extends keyof GenerateValidNumberSetOptions>(
    key: K,
    value: GenerateValidNumberSetOptions[K],
  ) => void;
  ```
  Exported from `lib/generator/index.ts`. Used in `context/useDataProvider.tsx` and `components/generator-components/generator-controls/types.ts`.
- Added `NumericOptionKey` mapped type in `components/generator-components/generator-controls/index.tsx` to remove `any`.
- `context/useDataProvider.tsx`: typed update callback wrapped in `useCallback`; dropped the useless `useMemo` on the context value; replaced `alert()` with `toast.error()`.
- `components/generator-components/generator-controls/accordion-items/odd-even-dist.tsx`: replaced prop mutation (`prevRange[0] = ...`) with `const nextRange: [number, number] = [...genOptions.oddRange];`.
- `components/providers.tsx`: removed `hasMounted` gating entirely.
- `app/layout.tsx`: added `suppressHydrationWarning` to `<html>`.
- `app/page.tsx`: rendered an `isLoading` spinner and an error banner with a Retry button before `pastNumbers` loads.
- `app/check-numbers/page.tsx`: `alert` → `toast` for match / no-match / error.
- `components/theme-toggle.tsx`: removed `useEffect`+`setState` mounted pattern; uses `resolvedTheme === undefined` to render a disabled placeholder.
- `components/nav.tsx`: replaced `<a>` with `<Link>` from `next/link`.

### `test/generator-helpers` — `1a6d780` test: add Vitest and unit tests for generator helpers
Off `fix/generator-correctness`. Critique item #19 (test coverage).

- `package.json`: added `vitest` + `@vitest/coverage-v8` devDeps and scripts (`test`, `test:watch`, `test:coverage`).
- `vitest.config.ts`: node environment, `lib/**/*.test.ts` include, `@/*` path alias.
- `lib/generator/threshold-criteria/utils.test.ts`: 7 tests for `percentile` (numpy-style linear interpolation, sort-independence, no mutation).
- `lib/generator/generate-numbers/utils.test.ts`: tests for `isSumInRange`, `maxGapExceedsThreshold`, `countMultiples`, `countClustersMainNumbers`, `countMaxConsecutiveRun`, `generateRandomNumber`, `generateUniqueNumbers`.
- `lib/generator/generate-pattern-probs.test.ts`: confirms `special_1` and `special_2` produce different averages post-fix; covers all 12 pattern keys; empty-input case.
- 36 tests passing.

### `refactor/generator-rules` — `a34ec2b` refactor(generator): extract constraint chain into composable rules
Off `test/generator-helpers`. Critique items #11–#16, #18.

- **#12** — New `lib/generator/generate-numbers/rules.ts` exports `mainRules` and `luckyRules` arrays of `(nums, opts) => RejectionReason | null` plus `evaluateRules`. The loop in `generate-numbers/index.ts` shrinks from a wall of nested ifs to one `evaluateRules` call per phase; the rejection-reason key is derived from the rule itself rather than restated at every check site.
- **#11** — `generateValidNumberSet` accepts an optional `precomputedPositionCounters` (third arg). `WorkerRequest` and `GeneratorContainer` props gained an optional `positionCounters` field; `app/page.tsx` passes `analysis?.positionCounters` so the worker reuses what `ThresholdCriteria` already built.
- **#14** — Added `clusterGroupSize` option (default 10) in `types.ts` + `constants.ts`. `countClustersMainNumbers` is now called with `maxMain` and `clusterGroupSize`; the UK Lotto bounds are no longer hardcoded inside the generator loop.
- **#15** — `countMaxConsecutiveRun` now sorts defensively. Two new tests in `utils.test.ts` cover unsorted input and no-mutation. 38 tests passing.
- **#13** — `getTopNumbersHistorical` validates `topNumbers.length === 7` and constructs the `LotteryTuple` element-by-element instead of casting `string[]`.
- **#16, #18** — already done as side effects of branch 1 (dead `pattern_prob_threshold` removed; outer `console.log`s gated).

### `chore/ignore-internal-docs` — `81a8a3c` chore: ignore internal-docs working-tree notes
Off `refactor/generator-rules`. `.gitignore` excludes `/internal-docs` so this tracking doc never gets committed.

## In progress

(none — all six branches merged to main locally; awaiting push)

### `feat/dual-heatmap` — `c66a6e4` feat(heatmap): split into per-field-group heatmaps driven by FIELDS
Off `main`. Critique item #5.

- Group `FIELDS` by `max` (contiguous runs of equal max) to derive heatmap groups dynamically. UK Lotto produces two: positions 0–4 (mains, 1–50) and positions 5–6 (luckies, 1–11).
- `Heatmap` container renders one `<PositionHeatmap>` per group with a per-group `<h3>` label (e.g. "N1, N2, N3, N4, N5 (1–50)"); cells are filtered by `positionSet` so each heatmap only shows its own positions.
- `PositionHeatmap` props changed: `numPositions: number` → `positions: number[] + positionLabels: string[]`. The hard-coded `pos + 1 <= 5 ? "N" : "L"` ternary is gone — labels come from `FIELDS`. This is the prerequisite for multi-lottery support.
- **Verified:** `npm run build` succeeds. **Not visually verified** in a browser — recommend a quick manual check that the two heatmaps render side-by-side / stacked as expected.

### `chore/static-data-import` — `185624c` chore(data): import external-data.json statically instead of fetching
Off `main`. Critique item #19 (caching). User picked this approach for GitHub Actions compatibility — the workflow regenerates and commits the JSON daily, so a build-time import is simpler/cheaper than runtime fetch.

- `useDataProvider` imports `public/data/external-data.json` at module load. Next.js inlines the 221 KB JSON into the client bundle.
- `pastNumbers`, `dates`, `updatedAt`, `analysis` are computed once at module scope and exposed as non-nullable. Provider only owns `genOptions` state. `isLoading` / `error` / `refresh` plumbing removed.
- A boundary check at module load throws if `results` is missing or empty so the failure mode is loud.
- Consumer cleanups: dropped the "Loading…" branch in `historical`, the empty-data alert in `check-numbers`, the redundant null guard in `GeneratorContainer`.

## Future considerations (not in this refactor)

User-flagged but explicitly out of scope for now:
- Multi-lottery support (not just Euromillions / UK Lotto).
- `localStorage` for saved number sets (no logins).
- In-UI notifications instead of remaining `alert`s.
- Historical match checking against **portions** of number sets, not just exact matches.

## Skipped from the original critique

- **#10 (ThresholdCriteria in worker)** — user said "already gets the full history", skip.

## Open questions / next decisions

- 11 commits sit on local `main` ahead of `origin/main`. Run `git push origin main` to publish.
- Visual check of the dual heatmap in a browser is still recommended — `npm run build` passes but it hasn't been rendered.
