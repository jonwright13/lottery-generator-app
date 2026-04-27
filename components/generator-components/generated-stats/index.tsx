"use client";

import { Card } from "@/components/ui/card";
import type {
  GenerateValidNumberSetOptions,
  LotteryTuple,
} from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  combination: LotteryTuple;
  bestPatternProb: number[] | null;
  genOptions: GenerateValidNumberSetOptions;
  previousDraw: LotteryTuple | null;
}

const MAIN_COUNT = 5;

interface ClusterBar {
  start: number;
  end: number;
  count: number;
}

const maxConsecutiveGap = (sorted: number[]): number => {
  let max = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > max) max = gap;
  }
  return max;
};

const inBandClass = (ok: boolean) =>
  ok
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-amber-700 dark:text-amber-400";

export const GeneratedStats = ({
  combination,
  bestPatternProb,
  genOptions,
  previousDraw,
}: Props) => {
  const stats = useMemo(() => {
    const main = combination.slice(0, MAIN_COUNT).map((n) => parseInt(n, 10));
    const lucky = combination.slice(MAIN_COUNT).map((n) => parseInt(n, 10));
    const sortedMain = [...main].sort((a, b) => a - b);
    const sortedLucky = [...lucky].sort((a, b) => a - b);

    const sum = main.reduce((a, b) => a + b, 0);
    const oddCount = main.filter((n) => n % 2 === 1).length;
    const evenCount = main.length - oddCount;
    const maxMainGap = maxConsecutiveGap(sortedMain);
    const maxLuckyGap = maxConsecutiveGap(sortedLucky);

    const lastDigitCounts: Record<number, number> = {};
    let maxSameLastDigit = 0;
    let maxSameLastDigitValue = 0;
    for (const n of main) {
      const d = n % 10;
      lastDigitCounts[d] = (lastDigitCounts[d] ?? 0) + 1;
      if (lastDigitCounts[d] > maxSameLastDigit) {
        maxSameLastDigit = lastDigitCounts[d];
        maxSameLastDigitValue = d;
      }
    }

    const groupSize = genOptions.clusterGroupSize;
    const numGroups = Math.ceil(genOptions.maxMain / groupSize);
    const clusters: ClusterBar[] = Array.from({ length: numGroups }, (_, i) => ({
      start: i * groupSize + 1,
      end: Math.min((i + 1) * groupSize, genOptions.maxMain),
      count: 0,
    }));
    for (const n of main) {
      const idx = Math.floor((n - 1) / groupSize);
      if (clusters[idx]) clusters[idx].count += 1;
    }

    let previousOverlap = 0;
    if (previousDraw) {
      const prev = new Set(previousDraw.slice(0, MAIN_COUNT));
      for (const s of combination.slice(0, MAIN_COUNT)) {
        if (prev.has(s)) previousOverlap += 1;
      }
    }

    const sortedMainSet = new Set(sortedMain);
    let ap3Diff: number | null = null;
    outer: for (let i = 0; i < sortedMain.length; i++) {
      for (let j = i + 1; j < sortedMain.length; j++) {
        const d = sortedMain[j] - sortedMain[i];
        if (d < 2) continue;
        if (sortedMainSet.has(sortedMain[i] + 2 * d)) {
          ap3Diff = d;
          break outer;
        }
      }
    }

    return {
      sum,
      oddCount,
      evenCount,
      maxMainGap,
      maxLuckyGap,
      clusters,
      maxSameLastDigit,
      maxSameLastDigitValue,
      previousOverlap,
      ap3Diff,
    };
  }, [combination, genOptions, previousDraw]);

  const sumOk = stats.sum >= genOptions.sumMin && stats.sum <= genOptions.sumMax;
  const oddOk =
    stats.oddCount >= genOptions.oddRange[0] &&
    stats.oddCount <= genOptions.oddRange[1];
  const mainGapOk = stats.maxMainGap <= genOptions.maxMainGapThreshold;
  const luckyGapOk = stats.maxLuckyGap <= genOptions.maxLuckyGapThreshold;
  const clusterOk = stats.clusters.every((c) => c.count <= genOptions.clusterMax);
  const lastDigitOk = stats.maxSameLastDigit <= genOptions.maxSameLastDigit;
  const overlapOk =
    stats.previousOverlap <= genOptions.maxPreviousDrawOverlap;
  const ap3Ok = stats.ap3Diff === null;

  const positionLabels = [
    "Main 1",
    "Main 2",
    "Main 3",
    "Main 4",
    "Main 5",
    "Lucky 1",
    "Lucky 2",
  ];
  const maxProb = Math.max(...(bestPatternProb ?? [0]), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full h-full">
      <div className="flex flex-col gap-y-1">
        <h3 className="text-lg font-medium">Set characteristics</h3>
        <p className="text-xs text-muted-foreground">
          How this set sits against the historical thresholds the generator is
          tuned to.
        </p>
      </div>

      {bestPatternProb && (
        <div className="flex flex-col gap-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Per-position frequency
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {bestPatternProb.map((p, i) => {
              const widthPct = (p / maxProb) * 100;
              const isMain = i < MAIN_COUNT;
              return (
                <li key={i} className="flex items-center gap-x-2">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">
                    {positionLabels[i]}
                  </span>
                  <div className="relative flex-1 h-3 rounded-sm bg-muted/50 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-sm",
                        isMain
                          ? "bg-sky-500/80 dark:bg-sky-400/70"
                          : "bg-amber-500/80 dark:bg-amber-400/70",
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-12 text-right">
                    {p.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1.5 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Sum (main)</dt>
        <dd className="text-right tabular-nums">{stats.sum}</dd>
        <dd className={cn("text-right tabular-nums", inBandClass(sumOk))}>
          {sumOk ? "in" : "outside"} {genOptions.sumMin}–{genOptions.sumMax}
        </dd>

        <dt className="text-muted-foreground">Odd / even (main)</dt>
        <dd className="text-right tabular-nums">
          {stats.oddCount} odd · {stats.evenCount} even
        </dd>
        <dd className={cn("text-right tabular-nums", inBandClass(oddOk))}>
          {oddOk ? "in" : "outside"} {genOptions.oddRange[0]}–
          {genOptions.oddRange[1]}
        </dd>

        <dt className="text-muted-foreground">Max gap (main)</dt>
        <dd className="text-right tabular-nums">{stats.maxMainGap}</dd>
        <dd className={cn("text-right tabular-nums", inBandClass(mainGapOk))}>
          {mainGapOk ? "≤" : ">"} {genOptions.maxMainGapThreshold}
        </dd>

        <dt className="text-muted-foreground">Max gap (lucky)</dt>
        <dd className="text-right tabular-nums">{stats.maxLuckyGap}</dd>
        <dd className={cn("text-right tabular-nums", inBandClass(luckyGapOk))}>
          {luckyGapOk ? "≤" : ">"} {genOptions.maxLuckyGapThreshold}
        </dd>

        <dt className="text-muted-foreground">Max same last digit</dt>
        <dd className="text-right tabular-nums">
          {stats.maxSameLastDigit}
          {stats.maxSameLastDigit > 1 && ` (·${stats.maxSameLastDigitValue})`}
        </dd>
        <dd className={cn("text-right tabular-nums", inBandClass(lastDigitOk))}>
          {lastDigitOk ? "≤" : ">"} {genOptions.maxSameLastDigit}
        </dd>

        {previousDraw && (
          <>
            <dt className="text-muted-foreground">Overlap w/ previous draw</dt>
            <dd className="text-right tabular-nums">{stats.previousOverlap}</dd>
            <dd
              className={cn("text-right tabular-nums", inBandClass(overlapOk))}
            >
              {overlapOk ? "≤" : ">"} {genOptions.maxPreviousDrawOverlap}
            </dd>
          </>
        )}

        <dt className="text-muted-foreground">Arithmetic progression</dt>
        <dd className="text-right tabular-nums">
          {stats.ap3Diff === null ? "none" : `d = ${stats.ap3Diff}`}
        </dd>
        <dd className={cn("text-right tabular-nums", inBandClass(ap3Ok))}>
          {ap3Ok ? "no AP-3" : "AP-3 present"}
        </dd>
      </dl>

      <div className="flex flex-col gap-y-2 border-t pt-3">
        <div className="flex items-baseline justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Cluster distribution (main)
          </h4>
          <span
            className={cn(
              "text-xs tabular-nums",
              inBandClass(clusterOk),
            )}
          >
            cap {genOptions.clusterMax} per group
          </span>
        </div>
        <ul
          className="flex items-end gap-x-1 h-16"
          aria-label="Cluster distribution"
        >
          {stats.clusters.map((c) => {
            const heightPct = (c.count / Math.max(genOptions.clusterMax, 1)) * 100;
            const over = c.count > genOptions.clusterMax;
            return (
              <li
                key={c.start}
                className="flex flex-col items-center justify-end gap-y-1 flex-1 h-full"
                title={`${c.start}–${c.end}: ${c.count}`}
              >
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {c.count}
                </span>
                <div
                  className={cn(
                    "w-full rounded-sm",
                    over
                      ? "bg-amber-500/80 dark:bg-amber-400/70"
                      : "bg-sky-500/80 dark:bg-sky-400/70",
                  )}
                  style={{ height: `${Math.min(heightPct, 100)}%` }}
                />
              </li>
            );
          })}
        </ul>
        <ul className="flex gap-x-1 text-[10px] text-muted-foreground tabular-nums">
          {stats.clusters.map((c) => (
            <li key={c.start} className="flex-1 text-center">
              {c.start}–{c.end}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
