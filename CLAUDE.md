# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (uses `eslint-config-next` flat config in `eslint.config.mjs`)
- `npm run fetch:data` — refresh `public/data/external-data.json` from the UK lottery CSV feed (also runs daily via `.github/workflows/fetch-data.yml`)

There is no test runner configured.

Path alias: `@/*` resolves to the repo root (see `tsconfig.json`). Use it everywhere instead of relative imports.

## Architecture

This is a Next.js 16 App Router / React 19 / Tailwind v4 single-page app that generates UK Lotto / "Hot Picks"-style number sets (5 main numbers 1–50 + 2 lucky numbers 1–11; see `constants.ts` and `lib/generator/constants.ts`). All compute runs in the browser; there is no backend.

### Data flow

1. `scripts/fetch-data.mjs` (run by GitHub Actions on a daily cron) fetches a CSV from `lottery.merseyworld.com`, parses both the draw tuples (`N1..N5,L1,L2`, zero-padded strings) and the draw dates (ISO), and writes the result to `public/data/external-data.json`. The script hashes old vs. new contents and skips writing if unchanged so the workflow doesn't make empty commits.
2. `context/useDataProvider.tsx` (`DataProvider`) is mounted high in the tree by `components/providers.tsx`. It client-side `fetch`es `/data/external-data.json`, exposes `pastNumbers`, `dates`, `updatedAt`, and a memoised `ThresholdCriteria` instance (`analysis`) via the `useData()` hook.
3. When `analysis` becomes available, the provider seeds `genOptions` from it: sum range, gap thresholds, multiples caps, and odd/even range are derived from the historical distribution rather than hard-coded.
4. `app/page.tsx` consumes `useData()` and wires the analysis + options into `GeneratorContainer` (run button), `GeneratorControls` (accordion of tunable thresholds), and `Heatmap` (positional frequency).

### Generator core (`lib/generator/`)

Two pieces, both pure TypeScript so they can run in a Web Worker:

- **`ThresholdCriteria` (`threshold-criteria/index.ts`)** — constructed from the historical draws. In its constructor it computes everything the UI needs to set sensible defaults:
  - `analyzeOddEvenDistribution` → `oddRange`
  - `analyzeSumRange` → `sumMin` / `sumMax` (15th/85th percentile of historical sums)
  - `determineGapThresholds` → `maxMainGapThreshold` / `maxLuckyGapThreshold` (95th percentile of position-to-position gaps)
  - `generateMaxMultiplesAllowed` → per-base (2..10) caps from 95th-percentile counts
  - `getMaxPatternProbabilities` → reference probabilities used in display
  - `positionCounters` → also exposed via `toHeatmapCells(min, max)` for the heat-map component
  Percentiles use `threshold-criteria/utils.ts:percentile` (numpy-style linear interpolation).
- **`generateValidNumberSet` (`generate-numbers/index.ts`)** — accepts the historical tuples plus a `Partial<GenerateValidNumberSetOptions>` (defaults from `DEFAULT_OPTIONS`). It loops up to `maxIterations`, generating random main + lucky tuples and rejecting any that fail the constraint chain (multiples cap → main gap → sum range → ≥3 consecutive run → odd/even balance → cluster max → lucky gap → tried-before / historical duplicate). For each accepted combination it computes a per-position frequency score against `positionCounters`; `bestScore` is the running max average. Returns immediately on the first combination that meets `minScore`, otherwise returns the best seen. `iterationCheckDict` (`generate-numbers/constants.ts`) is a module-level tally of rejection reasons used for debugging.

### Worker

`generateValidNumberSet` is heavy enough to block the main thread, so `components/generator-components/generator-container/index.tsx` instantiates `workers/generateNumbers.worker.ts` via `new Worker(new URL("@/workers/generateNumbers.worker.ts", import.meta.url), { type: "module" })`. Next.js bundles this automatically — keep the worker side-effect-free and import only from `@/lib/generator` so the worker bundle stays small.

### UI

- shadcn/ui (new-york style, neutral base, Lucide icons) — primitives live in `components/ui/`. `components.json` is the registry config; new components installed via `npx shadcn add` should land there. Utility merging via `cn()` in `lib/utils.ts`.
- Tailwind v4 (PostCSS-only, no `tailwind.config.*`); tokens and `@theme` live in `app/globals.css`.
- Theme handled by `next-themes` with `class` strategy; `Providers` gates rendering until `hasMounted` to avoid SSR/CSR theme mismatch.
- Toasts: `sonner` via `components/ui/sonner.tsx`.
- Pages other than `/`: `/check-numbers`, `/historical`, `/about` (each just a `page.tsx` under `app/`).

## Conventions

- Lottery numbers are zero-padded **strings** in tuples (`LotteryTuple = [string × 7]`); generator code converts to `number` only inside arithmetic helpers and re-pads with `padStart(2, "0")` before returning. Don't change the storage format — `external-data.json`, the historical-duplicate `Set` lookup, and the heat-map keying all depend on it.
- The first 5 entries of a tuple are the main numbers, the last 2 are the lucky/star numbers. Many functions take `mainOnly` / `countMain` / `countLucky` to slice accordingly.
- Generator defaults in `lib/generator/constants.ts` are a fallback only — the live UI overrides them from `ThresholdCriteria`. When changing defaults, check whether the override in `useDataProvider` still makes sense.
