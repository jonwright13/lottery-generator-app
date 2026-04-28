"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import { useData } from "@/context/useDataProvider";
import type { LotteryTuple, ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  pastNumbers: LotteryTuple[];
  analysis: ThresholdCriteria;
}

const BUCKET_SIZE = 10;

interface Bucket {
  start: number;
  end: number;
  count: number;
  inBand: boolean;
}

export const SumDistribution = ({ pastNumbers, analysis }: Props) => {
  const { game } = useData();
  const mainCount = game.main.count;

  const { buckets, total, mean, median } = useMemo(() => {
    const sums = pastNumbers.map((draw) =>
      draw
        .slice(0, mainCount)
        .reduce((acc, n) => acc + parseInt(n, 10), 0),
    );

    const min = Math.min(...sums);
    const max = Math.max(...sums);
    const startBucket = Math.floor(min / BUCKET_SIZE) * BUCKET_SIZE;
    const endBucket = Math.floor(max / BUCKET_SIZE) * BUCKET_SIZE;
    const bucketCount = (endBucket - startBucket) / BUCKET_SIZE + 1;

    const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, i) => {
      const start = startBucket + i * BUCKET_SIZE;
      return {
        start,
        end: start + BUCKET_SIZE - 1,
        count: 0,
        inBand: false,
      };
    });

    for (const sum of sums) {
      const idx = Math.floor((sum - startBucket) / BUCKET_SIZE);
      buckets[idx].count++;
    }

    for (const b of buckets) {
      b.inBand = b.end >= analysis.sumMin && b.start <= analysis.sumMax;
    }

    const total = sums.length;
    const mean = sums.reduce((a, b) => a + b, 0) / total;
    const sorted = [...sums].sort((a, b) => a - b);
    const median =
      sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    return { buckets, total, mean, median };
  }, [pastNumbers, analysis.sumMin, analysis.sumMax, mainCount]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Sum of main numbers</h2>
          <p className="text-xs text-muted-foreground">
            Distribution of the sum of each draw&apos;s {mainCount} main
            numbers. Highlighted buckets fall inside the 15th–85th percentile
            band ({analysis.sumMin}–{analysis.sumMax}).
          </p>
        </div>
        <HelpPopover title="Sum of main numbers">
          <p>
            Add the {mainCount} main numbers in each historical draw and
            bucket the totals. The result is a bell-shape centred near the
            middle of the possible range — sets that sum to extreme totals
            (very low or very high) are rare because they&apos;d need to be
            all-small or all-large balls.
          </p>
          <p>
            <strong>Why it matters:</strong> a balanced set tends to land in
            the 15th–85th percentile band shown here. The generator rejects
            candidate sets whose sum falls outside that band, which steers
            picks away from sums that history says almost never come up.
          </p>
        </HelpPopover>
      </div>

      <ul
        className="flex items-end gap-x-1 h-40 mt-2"
        aria-label="Sum distribution histogram"
      >
        {buckets.map((b) => {
          const heightPct = (b.count / maxCount) * 100;
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <li
              key={b.start}
              className="flex flex-col items-center justify-end gap-y-1 flex-1 h-full"
              title={`${b.start}–${b.end}: ${b.count} draws (${pct.toFixed(1)}%)`}
            >
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {b.count}
              </span>
              <div
                className={cn(
                  "w-full rounded-sm",
                  b.inBand
                    ? "bg-sky-500/80 dark:bg-sky-400/70"
                    : "bg-muted-foreground/30",
                )}
                style={{ height: `${heightPct}%` }}
              />
            </li>
          );
        })}
      </ul>
      <ul className="flex gap-x-1 text-[10px] text-muted-foreground tabular-nums">
        {buckets.map((b) => (
          <li key={b.start} className="flex-1 text-center">
            {b.start}
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Draws analysed</dt>
        <dd className="text-right tabular-nums">{total}</dd>
        <dt className="text-muted-foreground">Mean</dt>
        <dd className="text-right tabular-nums">{mean.toFixed(1)}</dd>
        <dt className="text-muted-foreground">Median</dt>
        <dd className="text-right tabular-nums">{median}</dd>
        <dt className="text-muted-foreground">15th–85th %ile band</dt>
        <dd className="text-right tabular-nums">
          {analysis.sumMin}–{analysis.sumMax}
        </dd>
      </dl>
    </Card>
  );
};
