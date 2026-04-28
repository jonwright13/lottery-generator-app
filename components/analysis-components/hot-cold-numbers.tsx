"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import { useData } from "@/context/useDataProvider";
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

const DEFAULT_WINDOW = 50;

const accumulate = (
  pastNumbers: LotteryTuple[],
  count: number,
  mainCount: number,
  mainMax: number,
): { counts: number[]; draws: number } => {
  const slice = pastNumbers.slice(0, count);
  const counts = new Array<number>(mainMax + 1).fill(0);
  for (const draw of slice) {
    for (let i = 0; i < mainCount; i++) {
      const n = parseInt(draw[i], 10);
      if (n >= 1 && n <= mainMax) counts[n] += 1;
    }
  }
  return { counts, draws: slice.length };
};

export const HotColdNumbers = ({ pastNumbers }: Props) => {
  const { game } = useData();
  const mainCount = game.main.count;
  const mainMax = game.main.max;
  const totalDraws = pastNumbers.length;
  const defaultWindow = Math.min(DEFAULT_WINDOW, totalDraws);
  const [windowSize, setWindowSize] = useState(defaultWindow);
  const safeWindow = Math.max(1, Math.min(windowSize, totalDraws));
  // Expected per-number share if numbers were drawn uniformly; used in the
  // footer to set context against the observed recent rate.
  const expectedPct = (mainCount / mainMax) * 100;

  const { rows, hottest, coldest, recentMeanPct } = useMemo(() => {
    const recent = accumulate(pastNumbers, safeWindow, mainCount, mainMax);
    const allTime = accumulate(pastNumbers, totalDraws, mainCount, mainMax);

    const rows: NumberRow[] = [];
    for (let n = 1; n <= mainMax; n++) {
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
  }, [pastNumbers, safeWindow, totalDraws, mainCount, mainMax]);

  const maxDelta = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Hot &amp; cold numbers</h2>
          <p className="text-xs text-muted-foreground">
            How recent appearances of each main number compare to its
            all-time rate. The generator&rsquo;s Recent-Frequency Bias
            control biases toward numbers above their all-time rate in the
            chosen window.
          </p>
        </div>
        <HelpPopover title="Hot &amp; cold numbers">
          <p>
            For each main number we compare its rate of appearance across
            the last N draws (the rolling window) against its rate across
            all of history. Numbers above their all-time rate are
            &ldquo;hot&rdquo;; below it are &ldquo;cold&rdquo;.
          </p>
          <p>
            <strong>Why it matters:</strong> classic gambler&apos;s-fallacy
            warning applies — past frequency doesn&apos;t change the next
            draw. But if you want to lean into momentum, the
            generator&apos;s Recent-Frequency Bias control nudges picks
            toward currently-hot numbers in the same window you choose
            here.
          </p>
        </HelpPopover>
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
          {recentMeanPct.toFixed(2)}% ({expectedPct.toFixed(1)}% expected for{" "}
          {mainCount}/{mainMax} main draws)
        </dd>
      </dl>
    </Card>
  );
};
