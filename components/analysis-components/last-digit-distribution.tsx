"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import { useData } from "@/context/useDataProvider";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface DigitBar {
  digit: number;
  count: number;
}

interface RepeatRow {
  repeat: number;
  count: number;
  pct: number;
  inBand: boolean;
}

export const LastDigitDistribution = ({ analysis }: Props) => {
  const { game } = useData();
  const mainCount = game.main.count;

  const { digitBars, repeatRows, total } = useMemo(() => {
    const totals = analysis.lastDigitDistributionData.perDigitTotals;
    const repeats = analysis.lastDigitDistributionData.maxRepeatDistribution;

    const digitBars: DigitBar[] = [];
    for (let d = 0; d <= 9; d++) {
      digitBars.push({ digit: d, count: totals[d] ?? 0 });
    }

    const total = Object.values(repeats).reduce((a, b) => a + b, 0);
    const repeatRows: RepeatRow[] = [];
    for (let r = 1; r <= mainCount; r++) {
      const count = repeats[r] ?? 0;
      repeatRows.push({
        repeat: r,
        count,
        pct: total > 0 ? (count / total) * 100 : 0,
        inBand: r <= analysis.maxSameLastDigit,
      });
    }

    return { digitBars, repeatRows, total };
  }, [analysis.lastDigitDistributionData, analysis.maxSameLastDigit, mainCount]);

  const digitMax = Math.max(...digitBars.map((d) => d.count), 1);
  const repeatMaxPct = Math.max(...repeatRows.map((r) => r.pct), 1);
  const withinCapPct = repeatRows
    .filter((r) => r.inBand)
    .reduce((acc, r) => acc + r.pct, 0);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Last-digit distribution</h2>
          <p className="text-xs text-muted-foreground">
            How the last digits (0–9) of the {mainCount} main numbers spread
            across each draw. Highlighted bars stay at or under the
            95th-percentile cap of {analysis.maxSameLastDigit}{" "}
            same-last-digit numbers per draw.
          </p>
        </div>
        <HelpPopover title="Last-digit distribution">
          <p>
            For each draw we look at the final digit of every main number
            (e.g. 7, 17, 27, 37, 47 all end in 7). The first chart shows the
            overall count per digit; the second shows how often a draw
            repeats the same last digit across multiple numbers.
          </p>
          <p>
            <strong>Why it matters:</strong> draws where many balls share a
            last digit are uncommon, and sets like &ldquo;all numbers ending
            in 7&rdquo; tend to be popular human picks (so jackpots get
            shared more often). The generator caps how many same-last-digit
            balls a candidate can contain at the 95th-percentile observed
            value.
          </p>
        </HelpPopover>
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Total numbers per last digit
        </h3>
        <ul
          className="flex items-end gap-x-1 h-32"
          aria-label="Total main numbers grouped by last digit"
        >
          {digitBars.map((b) => {
            const heightPct = (b.count / digitMax) * 100;
            return (
              <li
                key={b.digit}
                className="flex flex-col items-center justify-end gap-y-1 flex-1 h-full"
                title={`last digit ${b.digit}: ${b.count.toLocaleString()}`}
              >
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {b.count.toLocaleString()}
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
          {digitBars.map((b) => (
            <li key={b.digit} className="flex-1 text-center">
              {b.digit}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-y-2 border-t pt-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Max same-last-digit count per draw
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            cap: {analysis.maxSameLastDigit}
          </span>
        </div>
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Distribution of the largest same-last-digit count per draw"
        >
          {repeatRows.map((r) => {
            const widthPct = (r.pct / repeatMaxPct) * 100;
            return (
              <li key={r.repeat} className="flex items-center gap-x-3">
                <span className="text-xs text-muted-foreground tabular-nums w-32 shrink-0">
                  {r.repeat} share a digit
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-sm",
                      r.inBand
                        ? "bg-sky-500/80 dark:bg-sky-400/70"
                        : "bg-muted-foreground/30",
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-24 text-right">
                  {r.count.toLocaleString()} · {r.pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Draws analysed</dt>
        <dd className="text-right tabular-nums">{total.toLocaleString()}</dd>
        <dt className="text-muted-foreground">
          Within cap (≤ {analysis.maxSameLastDigit})
        </dt>
        <dd className="text-right tabular-nums">{withinCapPct.toFixed(1)}%</dd>
      </dl>
    </Card>
  );
};
