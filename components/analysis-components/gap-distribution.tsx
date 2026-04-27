"use client";

import { Card } from "@/components/ui/card";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface Bar {
  gap: number;
  count: number;
  inBand: boolean;
}

const MAIN_MAX_GAP_DISPLAY = 25;
const LUCKY_MAX_GAP_DISPLAY = 10;

const mergeCounters = (
  counters: Array<Record<number, number>>,
): Record<number, number> => {
  const merged: Record<number, number> = {};
  for (const c of counters) {
    for (const [k, v] of Object.entries(c)) {
      const gap = parseInt(k, 10);
      merged[gap] = (merged[gap] ?? 0) + v;
    }
  }
  return merged;
};

const buildBars = (
  counts: Record<number, number>,
  maxDisplay: number,
  threshold: number,
): Bar[] => {
  const observedMax = Math.max(
    ...Object.keys(counts).map((k) => parseInt(k, 10)),
    threshold,
  );
  const upper = Math.min(observedMax, maxDisplay);
  const bars: Bar[] = [];
  for (let gap = 1; gap <= upper; gap++) {
    bars.push({
      gap,
      count: counts[gap] ?? 0,
      inBand: gap <= threshold,
    });
  }
  return bars;
};

const GapBars = ({
  bars,
  threshold,
  ariaLabel,
}: {
  bars: Bar[];
  threshold: number;
  ariaLabel: string;
}) => {
  const max = Math.max(...bars.map((b) => b.count), 1);
  const total = bars.reduce((acc, b) => acc + b.count, 0);
  return (
    <div className="flex flex-col gap-y-1">
      <ul
        className="flex items-end gap-x-1 h-32"
        aria-label={ariaLabel}
      >
        {bars.map((b) => {
          const heightPct = (b.count / max) * 100;
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <li
              key={b.gap}
              className="flex flex-col items-center justify-end gap-y-1 flex-1 h-full"
              title={`gap ${b.gap}: ${b.count.toLocaleString()} (${pct.toFixed(1)}%)`}
            >
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
        {bars.map((b) => (
          <li
            key={b.gap}
            className={cn(
              "flex-1 text-center",
              b.gap === threshold && "text-foreground font-medium",
            )}
          >
            {b.gap}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const GapDistribution = ({ analysis }: Props) => {
  const { mainBars, luckyBars } = useMemo(() => {
    const mainCounts = mergeCounters(
      analysis.gapDistributionData.main.gapCounters,
    );
    const luckyCounts = mergeCounters(
      analysis.gapDistributionData.lucky.gapCounters,
    );
    return {
      mainBars: buildBars(
        mainCounts,
        MAIN_MAX_GAP_DISPLAY,
        analysis.maxMainGapThreshold,
      ),
      luckyBars: buildBars(
        luckyCounts,
        LUCKY_MAX_GAP_DISPLAY,
        analysis.maxLuckyGapThreshold,
      ),
    };
  }, [
    analysis.gapDistributionData,
    analysis.maxMainGapThreshold,
    analysis.maxLuckyGapThreshold,
  ]);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-lg font-medium">Gap distribution</h2>
        <p className="text-xs text-muted-foreground">
          Sizes of gaps between consecutive sorted numbers in each draw, summed
          across position pairs. Highlighted bars fall at or below the
          generator&apos;s 95th-percentile gap thresholds.
        </p>
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Main numbers
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            threshold: {analysis.maxMainGapThreshold}
          </span>
        </div>
        <GapBars
          bars={mainBars}
          threshold={analysis.maxMainGapThreshold}
          ariaLabel="Main number gap distribution"
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Lucky numbers
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            threshold: {analysis.maxLuckyGapThreshold}
          </span>
        </div>
        <GapBars
          bars={luckyBars}
          threshold={analysis.maxLuckyGapThreshold}
          ariaLabel="Lucky number gap distribution"
        />
      </div>
    </Card>
  );
};
