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

interface OverlapRow {
  overlap: number;
  count: number;
  pct: number;
  inBand: boolean;
}

export const PreviousDrawOverlap = ({ analysis }: Props) => {
  const { game } = useData();
  const mainCount = game.main.count;

  const { rows, total } = useMemo(() => {
    const dist = analysis.previousDrawOverlapData.overlapDistribution;
    const total = analysis.previousDrawOverlapData.pairsAnalysed;
    const cap = analysis.maxPreviousDrawOverlap;

    const rows: OverlapRow[] = [];
    for (let k = 0; k <= mainCount; k++) {
      const count = dist[k] ?? 0;
      rows.push({
        overlap: k,
        count,
        pct: total > 0 ? (count / total) * 100 : 0,
        inBand: k <= cap,
      });
    }
    return { rows, total };
  }, [analysis.previousDrawOverlapData, analysis.maxPreviousDrawOverlap, mainCount]);

  const maxPct = Math.max(...rows.map((r) => r.pct), 1);
  const withinCapPct = rows
    .filter((r) => r.inBand)
    .reduce((acc, r) => acc + r.pct, 0);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Overlap with previous draw</h2>
          <p className="text-xs text-muted-foreground">
            How many main numbers each draw shares with the immediately prior
            draw. Highlighted rows stay at or under the 95th-percentile cap
            of {analysis.maxPreviousDrawOverlap}.
          </p>
        </div>
        <HelpPopover title="Overlap with previous draw">
          <p>
            For every consecutive pair of historical draws, we count how many
            of the {mainCount} main numbers repeat from one to the next. Most
            of the time this is 0 or 1; high overlaps are rare even though
            individual balls are equally likely each time.
          </p>
          <p>
            <strong>Why it matters:</strong> generating a set that almost
            duplicates the most recent draw is uncommon territory. The
            generator caps overlap with the previous draw at the
            95th-percentile observed value so candidates don&apos;t mirror
            last week&apos;s result.
          </p>
        </HelpPopover>
      </div>

      <ul
        className="flex flex-col gap-y-1.5 mt-2"
        aria-label="Distribution of main-number overlap with the previous draw"
      >
        {rows.map((r) => {
          const widthPct = (r.pct / maxPct) * 100;
          return (
            <li key={r.overlap} className="flex items-center gap-x-3">
              <span className="text-xs text-muted-foreground tabular-nums w-32 shrink-0">
                {r.overlap} in common
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

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Pairs analysed</dt>
        <dd className="text-right tabular-nums">{total.toLocaleString()}</dd>
        <dt className="text-muted-foreground">
          Within cap (≤ {analysis.maxPreviousDrawOverlap})
        </dt>
        <dd className="text-right tabular-nums">{withinCapPct.toFixed(1)}%</dd>
      </dl>
    </Card>
  );
};
