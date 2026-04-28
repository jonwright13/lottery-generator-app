# Lottery Number Generator

A browser-based number generator and historical-analysis tool for UK lottery
games. All compute runs client-side; there is no backend. Historical data is
refreshed daily by a GitHub Actions cron and bundled into the static build.

## Supported games

- **EuroMillions** (default) — 5/50 main + 2/12 lucky stars
- **Lotto** — 6/59 main + 1 bonus
- **Thunderball** — 5/39 main + 1/14 thunderball
- **Set For Life** — 5/47 main + 1/10 life ball

The active game is held in the `?game=<id>` URL param and switched via the
navbar dropdown. Every page (generator, analysis, check, historical) respects
the current game; saved sets and Controls presets are scoped per game.

## Pages

- `/` — Generator + Controls + heatmap + match-results card
- `/analysis` — 16 cards covering the historical distribution: position
  heatmap, frequency, top-numbers-per-position, max pattern probabilities,
  sum, odd/even, gaps, decade bands, last-digit, multiples-of-N, prev-draw
  overlap, AP-3, consecutive runs, pair / triplet co-occurrence, hot/cold.
  Window filter (presets + custom range), jump-to-section TOC, floating
  back-to-top.
- `/check-numbers` — paste in a set, see how it would have done historically
- `/historical` — full draw archive
- `/about` — project notes

## Commands

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # production build
npm start            # serve the production build
npm run lint         # ESLint (flat config)
npm test             # Vitest run
npm run fetch:data   # refresh public/data/<game>.json from upstream feeds
```

The data refresh also runs daily via `.github/workflows/fetch-data.yml`. The
script hashes old vs. new contents and skips writing when nothing has
changed, so the cron doesn't make empty commits.

## Architecture (short version)

- **Next.js 16** App Router, **React 19**, **Tailwind v4** (PostCSS-only,
  tokens in `app/globals.css`), **shadcn/ui** primitives in `components/ui/`.
- The generator core lives in `lib/generator/`. `ThresholdCriteria`
  (`threshold-criteria/index.ts`) is built once from the historical draws and
  exposes the distributions every UI surface reads from. `generateValidNumberSet`
  (`generate-numbers/index.ts`) is the constraint-chain generator and runs in
  a Web Worker (`workers/generateNumbers.worker.ts`) to keep the main thread
  free.
- Per-game configs live in `lib/games/`. The generator and analysis are
  parameterised on `GameConfig`; tuples are variable-length so a game with
  fewer slots Just Works.
- Daily data fetcher is `scripts/fetch-data.mjs` driven by per-game source
  definitions in `scripts/data-sources.mjs`.

For deeper architectural detail see [`CLAUDE.md`](./CLAUDE.md). For the
full project history (sessions, decisions, deferred ideas) see
[`internal-docs/`](./internal-docs/).

## Conventions

- Lottery numbers are zero-padded **strings** in tuples (`LotteryTuple`).
  Generator code converts to `number` only inside arithmetic helpers and
  re-pads with `padStart(2, "0")` before returning. The storage format is
  load-bearing — `external-data.json`, the historical-duplicate Set lookup,
  and the heatmap keying all depend on it.
- Path alias `@/*` resolves to the repo root. Use it everywhere instead of
  relative imports.
- Branches off `dev`, merged to `dev` with `--no-ff`; `dev → main` is the
  release merge.
