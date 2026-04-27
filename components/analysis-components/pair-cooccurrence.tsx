"use client";

import { Card } from "@/components/ui/card";
import type { ThresholdCriteria } from "@/lib/generator";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface BucketRow {
  range: string;
  bucketLower: number;
  bucketUpper: number;
  pairs: number;
  pct: number;
}

const TOP_N = 12;
const BUCKETS = 8;

export const PairCoOccurrence = ({ analysis }: Props) => {
  const { topPairs, bucketRows, meanPairCount, totalPairsObserved, drawsAnalysed } =
    useMemo(() => {
      const data = analysis.pairCoOccurrenceData;
      const counts = data.pairCounts;

      const entries = Object.entries(counts);
      const sorted = entries
        .map(([key, count]) => {
          const [a, b] = key.split(",").map((n) => parseInt(n, 10));
          return { a, b, count };
        })
        .sort((x, y) => y.count - x.count);

      const topPairs = sorted.slice(0, TOP_N);

      const observedCounts = sorted.map((s) => s.count);
      const minCount =
        observedCounts.length > 0 ? Math.min(...observedCounts) : 0;
      const maxCount =
        observedCounts.length > 0 ? Math.max(...observedCounts) : 0;
      const range = Math.max(1, maxCount - minCount);
      const bucketSize = Math.max(1, Math.ceil(range / BUCKETS));

      const buckets: Record<number, number> = {};
      for (const c of observedCounts) {
        const idx = Math.min(BUCKETS - 1, Math.floor((c - minCount) / bucketSize));
        buckets[idx] = (buckets[idx] ?? 0) + 1;
      }
      const totalPairsObserved = sorted.length;
      const bucketRows: BucketRow[] = [];
      for (let i = 0; i < BUCKETS; i++) {
        const lower = minCount + i * bucketSize;
        const upper = i === BUCKETS - 1 ? maxCount : lower + bucketSize - 1;
        const pairs = buckets[i] ?? 0;
        bucketRows.push({
          range: lower === upper ? `${lower}` : `${lower}–${upper}`,
          bucketLower: lower,
          bucketUpper: upper,
          pairs,
          pct: totalPairsObserved > 0 ? (pairs / totalPairsObserved) * 100 : 0,
        });
      }

      return {
        topPairs,
        bucketRows,
        meanPairCount: data.meanPairCount,
        totalPairsObserved,
        drawsAnalysed: data.drawsAnalysed,
      };
    }, [analysis.pairCoOccurrenceData]);

  const topMax = Math.max(...topPairs.map((p) => p.count), 1);
  const bucketMaxPct = Math.max(...bucketRows.map((r) => r.pct), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-lg font-medium">Pair co-occurrence</h2>
        <p className="text-xs text-muted-foreground">
          How often each pair of main numbers has appeared together in
          historical draws. Used by the generator&rsquo;s optional pair-cohesion
          score, which biases toward sets whose pairs co-occur more frequently.
        </p>
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Top {topPairs.length} hottest pairs
        </h3>
        <ul className="flex flex-col gap-y-1.5" aria-label="Top co-occurring pairs">
          {topPairs.map((p) => {
            const widthPct = (p.count / topMax) * 100;
            return (
              <li
                key={`${p.a}-${p.b}`}
                className="flex items-center gap-x-3"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                  {p.a.toString().padStart(2, "0")} ·{" "}
                  {p.b.toString().padStart(2, "0")}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-12 text-right">
                  {p.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-y-2 border-t pt-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Pair count distribution
        </h3>
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Distribution of pairs by co-occurrence count"
        >
          {bucketRows.map((r) => {
            const widthPct = (r.pct / bucketMaxPct) * 100;
            return (
              <li
                key={`${r.bucketLower}-${r.bucketUpper}`}
                className="flex items-center gap-x-3"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                  {r.range}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-24 text-right">
                  {r.pairs.toLocaleString()} · {r.pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Draws analysed</dt>
        <dd className="text-right tabular-nums">
          {drawsAnalysed.toLocaleString()}
        </dd>
        <dt className="text-muted-foreground">Distinct pairs observed</dt>
        <dd className="text-right tabular-nums">
          {totalPairsObserved.toLocaleString()}
        </dd>
        <dt className="text-muted-foreground">Mean co-occurrence per pair</dt>
        <dd className="text-right tabular-nums">
          {meanPairCount.toFixed(2)}
        </dd>
      </dl>
    </Card>
  );
};
