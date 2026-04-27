"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { LotteryTuple } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

interface Props {
  pastNumbers: LotteryTuple[];
}

interface NumberRow {
  num: number;
  recentCount: number;
  recentPct: number;
  allTimeCount: number;
  allTimePct: number;
  delta: number;
}

const MAIN_COUNT = 5;
const MAIN_MAX = 50;
const DEFAULT_WINDOW = 50;

const accumulate = (
  pastNumbers: LotteryTuple[],
  count: number,
): { counts: number[]; draws: number } => {
  const slice = pastNumbers.slice(0, count);
  const counts = new Array<number>(MAIN_MAX + 1).fill(0);
  for (const draw of slice) {
    for (let i = 0; i < MAIN_COUNT; i++) {
      const n = parseInt(draw[i], 10);
      if (n >= 1 && n <= MAIN_MAX) counts[n] += 1;
    }
  }
  return { counts, draws: slice.length };
};

export const HotColdNumbers = ({ pastNumbers }: Props) => {
  const totalDraws = pastNumbers.length;
  const defaultWindow = Math.min(DEFAULT_WINDOW, totalDraws);
  const [windowSize, setWindowSize] = useState(defaultWindow);
  const safeWindow = Math.max(1, Math.min(windowSize, totalDraws));

  const { rows, hottest, coldest, recentMeanPct } = useMemo(() => {
    const recent = accumulate(pastNumbers, safeWindow);
    const allTime = accumulate(pastNumbers, totalDraws);

    const rows: NumberRow[] = [];
    for (let n = 1; n <= MAIN_MAX; n++) {
      const recentCount = recent.counts[n];
      const allTimeCount = allTime.counts[n];
      const recentPct =
        recent.draws > 0 ? (recentCount / recent.draws) * 100 : 0;
      const allTimePct =
        allTime.draws > 0 ? (allTimeCount / allTime.draws) * 100 : 0;
      rows.push({
        num: n,
        recentCount,
        recentPct,
        allTimeCount,
        allTimePct,
        delta: recentPct - allTimePct,
      });
    }
    const sortedByDelta = [...rows].sort((a, b) => b.delta - a.delta);
    const hottest = sortedByDelta.slice(0, 8);
    const coldest = sortedByDelta.slice(-8).reverse();
    const recentMeanPct =
      rows.reduce((acc, r) => acc + r.recentPct, 0) / rows.length;

    return { rows, hottest, coldest, recentMeanPct };
  }, [pastNumbers, safeWindow, totalDraws]);

  const maxDelta = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-lg font-medium">Hot &amp; cold numbers</h2>
        <p className="text-xs text-muted-foreground">
          How recent appearances of each main number compare to its all-time
          rate. The generator&rsquo;s Recent-Frequency Bias control biases
          toward numbers above their all-time rate in the chosen window.
        </p>
      </div>

      <div className="flex items-center gap-x-3">
        <Label htmlFor="hot-cold-window" className="text-xs text-muted-foreground">
          Window (draws)
        </Label>
        <Input
          id="hot-cold-window"
          type="number"
          min={1}
          max={totalDraws}
          step={5}
          value={windowSize}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isNaN(next)) setWindowSize(next);
          }}
          onFocus={(e) => e.target.select()}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground tabular-nums">
          covering {safeWindow.toLocaleString()} of{" "}
          {totalDraws.toLocaleString()} draws
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t pt-3">
        <div className="flex flex-col gap-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Hottest (recent above all-time)
          </h3>
          <ul className="flex flex-col gap-y-1.5" aria-label="Hottest numbers">
            {hottest.map((r) => {
              const widthPct = (r.delta / maxDelta) * 100;
              return (
                <li key={r.num} className="flex items-center gap-x-3">
                  <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
                    {r.num.toString().padStart(2, "0")}
                  </span>
                  <div className="relative flex-1 h-4 rounded-sm bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-emerald-500/80 dark:bg-emerald-400/70"
                      style={{ width: `${Math.max(0, widthPct)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-24 text-right">
                    {r.recentPct.toFixed(1)}% ·{" "}
                    {r.delta >= 0 ? "+" : ""}
                    {r.delta.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Coldest (recent below all-time)
          </h3>
          <ul className="flex flex-col gap-y-1.5" aria-label="Coldest numbers">
            {coldest.map((r) => {
              const widthPct = (Math.abs(r.delta) / maxDelta) * 100;
              return (
                <li key={r.num} className="flex items-center gap-x-3">
                  <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
                    {r.num.toString().padStart(2, "0")}
                  </span>
                  <div className="relative flex-1 h-4 rounded-sm bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-amber-500/80 dark:bg-amber-400/70"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-24 text-right">
                    {r.recentPct.toFixed(1)}% ·{" "}
                    {r.delta >= 0 ? "+" : ""}
                    {r.delta.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div
        className="flex flex-col gap-y-2 border-t pt-3"
        aria-label="All numbers, recent vs all-time"
      >
        <h3 className="text-sm font-medium text-muted-foreground">
          All numbers (recent − all-time)
        </h3>
        <ul className="grid grid-cols-5 sm:grid-cols-10 gap-x-1 gap-y-1.5">
          {rows.map((r) => {
            const isHot = r.delta > 0;
            const intensity = Math.min(1, Math.abs(r.delta) / maxDelta);
            return (
              <li
                key={r.num}
                className={cn(
                  "flex flex-col items-center justify-end gap-y-0.5 rounded-sm px-1 py-1 text-[10px] tabular-nums",
                  isHot
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300",
                )}
                style={{
                  backgroundColor: isHot
                    ? `rgba(16, 185, 129, ${intensity * 0.25 + 0.05})`
                    : `rgba(245, 158, 11, ${intensity * 0.25 + 0.05})`,
                }}
                title={`${r.num}: recent ${r.recentPct.toFixed(2)}%, all-time ${r.allTimePct.toFixed(2)}%`}
              >
                <span className="font-medium text-foreground">
                  {r.num.toString().padStart(2, "0")}
                </span>
                <span>
                  {r.delta >= 0 ? "+" : ""}
                  {r.delta.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Mean recent rate</dt>
        <dd className="text-right tabular-nums">
          {recentMeanPct.toFixed(2)}% (10% expected for 5/50 main draws)
        </dd>
      </dl>
    </Card>
  );
};
