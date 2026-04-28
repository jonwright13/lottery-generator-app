# Future Ideas

## Home page

### Save Controls preset per game

**Priority:** Medium
**Complexity:** Medium
**Status:** Implemented (2026-04-28, see progress.md)

Returning users have to re-tweak the Controls every visit. Save the active
configuration to localStorage scoped per game id (one preset per game), with
auto-load on return. Save button enables only when current config differs from
the saved preset; the Reset action splits into "Reset to defaults" and "Reset
to saved preset" so neither baseline is hidden.

---

### Add "Reset to defaults" to Controls

**Priority:** Medium
**Complexity:** Low
**Status:** Implemented (2026-04-28, see progress.md)

Once a user adjusts thresholds, there is no path back to the
`ThresholdCriteria`-seeded defaults short of a page reload. Add a small reset
affordance in the Controls card header that re-applies the seeded options.

**Considerations:**
- Defaults live in `useDataProvider.tsx` (`seededOptions`) — expose a
  `resetOptions` callback alongside `updateOptions`.

---

### Modified-vs-default indicator on Controls triggers

**Priority:** Low
**Complexity:** Low
**Status:** Implemented (2026-04-28, see progress.md)

Today the trigger shows the *current* value but not whether it differs from the
data-derived default. A small dot or "modified" tag would help users audit
their own changes at a glance.

---

### Plain-language relabel for Controls

**Priority:** Medium
**Complexity:** Low
**Status:** Implemented (2026-04-28, see progress.md)

"Cluster Max", "Positional Frequency Score", "Gap Distribution" are
implementation terms. For a casual user, replace with plain-language labels
("How spread out the numbers are", "How balanced odd vs even is") and keep the
technical name as helper text.

---

### Live "% of historical draws qualify" preview per control

**Priority:** Medium
**Complexity:** Medium
**Status:** Implemented (2026-04-28, see progress.md). Shipped as a single
cumulative count in the Controls card header rather than a number per
accordion row — the rules interact (a draw can fail two rules simultaneously),
so a per-rule "in isolation" reading would be misleading.

Whenever a user changes sumMin/sumMax, oddRange, gap thresholds, etc., compute
how many historical draws match the new constraints and show a live count
("3,127 of 3,400 draws qualify"). Gives controls immediate, tangible
feedback.

**Considerations:**
- All inputs are pure functions of `pastNumbers + genOptions`; can be done
  with a `useMemo` per control.

---

### Onboarding hint / first-time empty state

**Priority:** Low
**Complexity:** Low
**Status:** Implemented (2026-04-28, see progress.md)

The current empty state on the Generate card is a one-line hint. Could be
elevated with a tiny "What is this?" link to `/about` or a short explainer
inline.

---

### Heatmap drill-down on click

**Priority:** Low
**Complexity:** Medium
**Status:** Implemented (2026-04-28, see progress.md)

Cells are currently `<button>` elements with no click handler — accessibility
noise. Either repurpose the click (e.g., filter generation to favour that
position/number, or open a popover with the historical draws containing that
number in that position) or downgrade to a non-interactive role.

---

## Analysis page

### Historical window filter (full / 5y / 1y / custom)

**Priority:** High
**Complexity:** Medium
**Status:** Implemented (2026-04-27, see progress.md). Custom-range and
extra presets ("Last 6 months", "Last 10 years") shipped 2026-04-28
(`feat/analysis-final-polish`).

Let users restrict every analysis section (heatmap, sum distribution,
odd/even, top-numbers-per-position) to a window of recent draws — preset
options like "All time", "Last 5 years", "Last year", and ideally a custom
date range. Useful for spotting drift in how draws have behaved recently
versus the full history.

**Considerations:**
- The cleanest approach is to slice `pastNumbers`/`dates` by the chosen
  window and instantiate a fresh `ThresholdCriteria` from the slice, so every
  downstream component "just works" against a different analysis instance.
  Memoise per window so we don't rebuild on every render.
- Keep filter state local to `/analysis` (URL search param so the choice is
  shareable / refresh-stable), not in `DataProvider` — the generator's
  defaults should still come from full history.
- The sum-distribution component currently buckets inline from
  `pastNumbers`; if windowing is added, either move that into the analysis
  class or pass the sliced array through.

---

### More analysis sections to add later

**Priority:** Medium
**Complexity:** Low
**Status:** Implemented (2026-04-28, see progress.md). Decade-band
distribution (2026-04-27), triplet co-occurrence and consecutive-run-length
distribution (earlier on 2026-04-28), and finally multiples-of-N caps card
+ max-pattern-probabilities card (`feat/analysis-final-polish`,
2026-04-28). Pair co-occurrence covered by the existing pair card.
Hot/cold-numbers card already covers the "least drawn" mirror.

`ThresholdCriteria` already computes data we don't yet surface: gap
distributions per position, multiples-of-N caps, max pattern probabilities.
Each is a small additional card on `/analysis`. Also worth adding:
consecutive-run frequencies, pair/cluster co-occurrence, and a "least-drawn
numbers" mirror to the top-numbers component.

---

## Generator constraints

### Last-digit spread

**Priority:** Medium
**Complexity:** Medium
**Status:** Implemented (2026-04-27, see progress.md). UI control added
2026-04-27 (`feat/last-digit-control`).

Reject sets where too many main numbers share the same final digit (e.g.
4+ ending in 7). Historical UK draws rarely have 4+ matching last digits.

---

### Repeat-from-previous-draw count

**Priority:** Medium
**Complexity:** Medium
**Status:** Implemented (2026-04-27, see progress.md). Modelled as a
hard cap (95th-percentile-derived). Score-nudge variant could still be
explored later.

Reject sets that overlap with the immediately prior draw beyond the
cap. Surface card on /analysis + Set Characteristics row + Controls
accordion.

---

### Pair / triplet co-occurrence

**Priority:** Low
**Complexity:** High
**Status:** Implemented (2026-04-27 pair, 2026-04-28 triplet, see progress.md).

Pair version (50×50 matrix on `ThresholdCriteria`, optional
`pairScoreWeight` blend) is live. Triplet co-occurrence (C(50,3) =
19,600 entries) is now also live — implemented as a layered
`tripletScoreWeight` on top of the pair-blended score, with the
matrix only built/marshalled to the worker when the user has actually
weighted it. Default off; the SNR is poor on ≤3,000 draws so the
control is positioned as a soft tie-breaker rather than a strong
signal.

**Considerations:**
- Triplet matrix has lower expected count per cell (~1.4 hits per
  triplet across ~3000 draws) so signal-to-noise is poor.
- Storage is non-trivial (~20k entries) but still tractable.
- Could layer onto the existing pair-blend pattern with its own weight
  knob, but adds another scoring axis users have to understand.

---

### Hot / cold rolling-window frequency

**Priority:** Low
**Complexity:** Medium
**Status:** Implemented (2026-04-27, see progress.md)

Generator now blends a recent-window per-position frequency into the
optimisation target via `recentWindowSize` (last N draws) and
`recentBias` (0..1 weight). Default behaviour unchanged. Analysis page
adds a Hot &amp; cold numbers card with its own window selector showing
per-number recent vs all-time deltas.

---

### Arithmetic-progression / AP-3 reject

**Priority:** Low
**Complexity:** Low
**Status:** Implemented (2026-04-27, see progress.md)

Generator rejects any 3-AP among the main numbers with d ≥ 2 (d = 1 is
already covered by the consecutive-run rule). Analysis page shows
historical AP-3 incidence by common difference; Set Characteristics
card reports whether the generated set contains an AP-3.

---

## Data sources

### Restore Thunderball pre-2010 archive

**Priority:** Low
**Complexity:** Medium
**Status:** Open

The new per-game scraper (`scripts/data-sources.mjs`) produces a
Thunderball dataset that goes back to 2010 — when the draw moved
from once-a-week to four-times-a-week. The pre-2010 history (back to
2004-02-13, ~600 once-a-week draws) is no longer fetched. The release
merge to main on 2026-04-28 surfaced this when the dev-side
`thunderball.json` (2,929 draws, from 2010) replaced main's older
file (1,940 draws, from 2004).

**Considerations:**
- The pre-2010 archive lived under a different URL/format on the
  legacy lottery.merseyworld.com mirror. Any restore would mean
  teaching the scraper about both formats and merging them.
- Statistical impact is small for most analysis cards: 600 extra
  draws spread across 6 years is sparse, and the post-2010 sample
  alone (≈3k draws) already saturates most distributions. The card
  this matters most for is `consecutive-run-distribution` since the
  mid-2000s data has slightly different draw mechanics worth
  preserving for completeness.
- Deferred as low priority; revisit if a user complaint or analysis
  bug points back to the missing history.

---
