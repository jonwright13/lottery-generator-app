"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import { useData } from "@/context/useDataProvider";
import { DEFAULT_OPTIONS, type LotteryTuple } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  pastNumbers: LotteryTuple[];
}

const CLUSTER_MAX = DEFAULT_OPTIONS.clusterMax;
const CLUSTER_GROUP_SIZE = DEFAULT_OPTIONS.clusterGroupSize;

interface BandRow {
  start: number;
  end: number;
  totalCount: number;
  meanPerDraw: number;
}

interface MaxFillBar {
  fill: number;
  count: number;
  pct: number;
  inBand: boolean;
}

const computeBandStats = (
  pastNumbers: LotteryTuple[],
  mainCount: number,
  mainMax: number,
): { bands: BandRow[]; maxFills: MaxFillBar[]; total: number } => {
  const numBands = Math.ceil(mainMax / CLUSTER_GROUP_SIZE);
  const totals = new Array<number>(numBands).fill(0);
  const maxFillCounts: Record<number, number> = {};

  for (const draw of pastNumbers) {
    const perBand = new Array<number>(numBands).fill(0);
    for (let i = 0; i < mainCount; i++) {
      const n = parseInt(draw[i], 10);
      const idx = Math.floor((n - 1) / CLUSTER_GROUP_SIZE);
      if (idx >= 0 && idx < numBands) {
        perBand[idx] += 1;
        totals[idx] += 1;
      }
    }
    const maxFill = Math.max(...perBand);
    maxFillCounts[maxFill] = (maxFillCounts[maxFill] ?? 0) + 1;
  }

  const total = pastNumbers.length;
  const bands: BandRow[] = totals.map((count, i) => {
    const start = i * CLUSTER_GROUP_SIZE + 1;
    return {
      start,
      end: Math.min((i + 1) * CLUSTER_GROUP_SIZE, mainMax),
      totalCount: count,
      meanPerDraw: total > 0 ? count / total : 0,
    };
  });

  const observedMaxFill = Math.max(
    ...Object.keys(maxFillCounts).map((k) => parseInt(k, 10)),
    mainCount,
  );
  const maxFills: MaxFillBar[] = [];
  for (let f = 1; f <= observedMaxFill; f++) {
    const count = maxFillCounts[f] ?? 0;
    maxFills.push({
      fill: f,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      inBand: f <= CLUSTER_MAX,
    });
  }

  return { bands, maxFills, total };
};

export const ClusterDistribution = ({ pastNumbers }: Props) => {
  const { game } = useData();
  const mainCount = game.main.count;
  const mainMax = game.main.max;
  const { bands, maxFills, total } = useMemo(
    () => computeBandStats(pastNumbers, mainCount, mainMax),
    [pastNumbers, mainCount, mainMax],
  );

  const meanMax = Math.max(...bands.map((b) => b.meanPerDraw), 0.01);
  const fillMaxPct = Math.max(...maxFills.map((b) => b.pct), 1);
  const withinCapPct = maxFills
    .filter((b) => b.inBand)
    .reduce((acc, b) => acc + b.pct, 0);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Decade-band distribution</h2>
          <p className="text-xs text-muted-foreground">
            How the {mainCount} main numbers spread across {bands.length}{" "}
            bands of {CLUSTER_GROUP_SIZE} (1–{CLUSTER_GROUP_SIZE}, …). The
            cluster rule rejects sets with more than {CLUSTER_MAX} numbers in
            any one band.
          </p>
        </div>
        <HelpPopover title="Decade-band distribution">
          <p>
            The pool is split into bands of {CLUSTER_GROUP_SIZE} (1–
            {CLUSTER_GROUP_SIZE}, {CLUSTER_GROUP_SIZE + 1}–
            {CLUSTER_GROUP_SIZE * 2}, etc.). For each draw we look at how
            many of the {mainCount} mains fall into each band — most draws
            are spread across several bands rather than clumped in one.
          </p>
          <p>
            <strong>Why it matters:</strong> sets that cluster heavily into
            one band (e.g. five numbers all in 1–10) are rare. The
            generator&apos;s cluster cap rejects any candidate with more than
            {" "}
            {CLUSTER_MAX} numbers in a single band, keeping picks spread
            across the full range.
          </p>
        </HelpPopover>
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Mean numbers per band
        </h3>
        <ul
          className="flex items-end gap-x-1 h-32"
          aria-label="Mean main numbers per decade band"
        >
          {bands.map((b) => {
            const heightPct = (b.meanPerDraw / meanMax) * 100;
            return (
              <li
                key={b.start}
                className="flex flex-col items-center justify-end gap-y-1 flex-1 h-full"
                title={`${b.start}–${b.end}: ${b.meanPerDraw.toFixed(2)} per draw on average (${b.totalCount.toLocaleString()} total)`}
              >
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {b.meanPerDraw.toFixed(2)}
                </span>
                <div
                  className="w-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                  style={{ height: `${heightPct}%` }}
                />
              </li>
            );
          })}
        </ul>
        <ul className="flex gap-x-1 text-[10px] text-muted-foreground tabular-nums">
          {bands.map((b) => (
            <li key={b.start} className="flex-1 text-center">
              {b.start}–{b.end}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-y-2 border-t pt-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Max single-band fill per draw
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            cap: {CLUSTER_MAX}
          </span>
        </div>
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Distribution of the largest single-band fill per draw"
        >
          {maxFills.map((b) => {
            const widthPct = (b.pct / fillMaxPct) * 100;
            return (
              <li key={b.fill} className="flex items-center gap-x-3">
                <span className="text-xs text-muted-foreground tabular-nums w-28 shrink-0">
                  {b.fill} in one band
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-sm",
                      b.inBand
                        ? "bg-sky-500/80 dark:bg-sky-400/70"
                        : "bg-muted-foreground/30",
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-24 text-right">
                  {b.count.toLocaleString()} · {b.pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Draws analysed</dt>
        <dd className="text-right tabular-nums">{total.toLocaleString()}</dd>
        <dt className="text-muted-foreground">Within cap (≤ {CLUSTER_MAX})</dt>
        <dd className="text-right tabular-nums">
          {withinCapPct.toFixed(1)}%
        </dd>
      </dl>
    </Card>
  );
};
