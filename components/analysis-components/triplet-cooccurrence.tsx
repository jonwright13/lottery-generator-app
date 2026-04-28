"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface BucketRow {
  range: string;
  bucketLower: number;
  bucketUpper: number;
  triplets: number;
  pct: number;
}

const TOP_N = 12;
const BUCKETS = 8;

export const TripletCoOccurrence = ({ analysis }: Props) => {
  const {
    topTriplets,
    bucketRows,
    meanTripletCount,
    totalTripletsObserved,
    drawsAnalysed,
  } = useMemo(() => {
    const data = analysis.tripletCoOccurrenceData;
    const counts = data.tripletCounts;

    const sorted = Object.entries(counts)
      .map(([key, count]) => {
        const [a, b, c] = key.split(",").map((n) => parseInt(n, 10));
        return { a, b, c, count };
      })
      .sort((x, y) => y.count - x.count);

    const topTriplets = sorted.slice(0, TOP_N);

    const observedCounts = sorted.map((s) => s.count);
    const minCount =
      observedCounts.length > 0 ? Math.min(...observedCounts) : 0;
    const maxCount =
      observedCounts.length > 0 ? Math.max(...observedCounts) : 0;
    const range = Math.max(1, maxCount - minCount);
    const bucketSize = Math.max(1, Math.ceil(range / BUCKETS));

    const buckets: Record<number, number> = {};
    for (const cnt of observedCounts) {
      const idx = Math.min(
        BUCKETS - 1,
        Math.floor((cnt - minCount) / bucketSize),
      );
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
    const totalTripletsObserved = sorted.length;
    const bucketRows: BucketRow[] = [];
    for (let i = 0; i < BUCKETS; i++) {
      const lower = minCount + i * bucketSize;
      const upper = i === BUCKETS - 1 ? maxCount : lower + bucketSize - 1;
      const triplets = buckets[i] ?? 0;
      bucketRows.push({
        range: lower === upper ? `${lower}` : `${lower}–${upper}`,
        bucketLower: lower,
        bucketUpper: upper,
        triplets,
        pct:
          totalTripletsObserved > 0
            ? (triplets / totalTripletsObserved) * 100
            : 0,
      });
    }

    return {
      topTriplets,
      bucketRows,
      meanTripletCount: data.meanTripletCount,
      totalTripletsObserved,
      drawsAnalysed: data.drawsAnalysed,
    };
  }, [analysis.tripletCoOccurrenceData]);

  const topMax = Math.max(...topTriplets.map((p) => p.count), 1);
  const bucketMaxPct = Math.max(...bucketRows.map((r) => r.pct), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Triplet co-occurrence</h2>
          <p className="text-xs text-muted-foreground">
            How often each triple of main numbers has appeared together in
            historical draws. Used by the generator&rsquo;s optional
            triplet-cohesion score.
          </p>
        </div>
        <HelpPopover title="Triplet co-occurrence">
          <p>
            For every possible triple of main numbers (e.g. 7, 23, 45), we
            count how many historical draws contained all three. The
            &ldquo;hottest triplets&rdquo; are the ones that have shown up
            together most often.
          </p>
          <p>
            <strong>Why it matters:</strong> three-way overlap is much rarer
            than two-way overlap, so most triplets sit at 0 or 1 hit. The
            distribution chart below makes that obvious — high counts are
            extreme outliers, not patterns. Treat the triplet-cohesion bias
            as a soft tie-breaker rather than a strong signal; the
            signal-to-noise across ~3,000 draws and tens of thousands of
            possible triplets is intrinsically poor.
          </p>
        </HelpPopover>
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Top {topTriplets.length} hottest triplets
        </h3>
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Top co-occurring triplets"
        >
          {topTriplets.map((t) => {
            const widthPct = (t.count / topMax) * 100;
            return (
              <li
                key={`${t.a}-${t.b}-${t.c}`}
                className="flex items-center gap-x-3"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-28 shrink-0">
                  {t.a.toString().padStart(2, "0")} ·{" "}
                  {t.b.toString().padStart(2, "0")} ·{" "}
                  {t.c.toString().padStart(2, "0")}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-12 text-right">
                  {t.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-y-2 border-t pt-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Triplet count distribution
        </h3>
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Distribution of triplets by co-occurrence count"
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
                  {r.triplets.toLocaleString()} · {r.pct.toFixed(1)}%
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
        <dt className="text-muted-foreground">Distinct triplets observed</dt>
        <dd className="text-right tabular-nums">
          {totalTripletsObserved.toLocaleString()}
        </dd>
        <dt className="text-muted-foreground">
          Mean co-occurrence per triplet
        </dt>
        <dd className="text-right tabular-nums">
          {meanTripletCount.toFixed(2)}
        </dd>
      </dl>
    </Card>
  );
};
