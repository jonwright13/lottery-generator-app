"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface Segment {
  count: number;
  draws: number;
  pct: number;
  exceedsCap: boolean;
}

interface BaseRow {
  base: number;
  cap: number;
  withinCapPct: number;
  segments: Segment[];
}

export const MultiplesDistribution = ({ analysis }: Props) => {
  const mainCount = analysis.game.main.count;

  const { rows, drawsAnalysed } = useMemo(() => {
    const data = analysis.multiplesDistributionData;
    const drawsAnalysed = data.drawsAnalysed;
    const bases = Object.keys(data.byBase)
      .map((b) => parseInt(b, 10))
      .sort((a, b) => a - b);

    const rows: BaseRow[] = bases.map((base) => {
      const dist = data.byBase[base] ?? {};
      const cap = analysis.maxMultiplesAllowed[base] ?? mainCount;

      const segments: Segment[] = [];
      for (let count = 0; count <= mainCount; count++) {
        const draws = dist[count] ?? 0;
        segments.push({
          count,
          draws,
          pct: drawsAnalysed > 0 ? (draws / drawsAnalysed) * 100 : 0,
          exceedsCap: count > cap,
        });
      }
      const withinCapPct = segments
        .filter((s) => !s.exceedsCap)
        .reduce((acc, s) => acc + s.pct, 0);

      return { base, cap, withinCapPct, segments };
    });

    return { rows, drawsAnalysed };
  }, [
    analysis.multiplesDistributionData,
    analysis.maxMultiplesAllowed,
    mainCount,
  ]);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Multiples-of-N caps</h2>
          <p className="text-xs text-muted-foreground">
            For each small base (2…10), how many of the {mainCount} main
            numbers are usually multiples of that base. The generator caps
            each base at its 95th-percentile observed count and rejects
            candidates that exceed it.
          </p>
        </div>
        <HelpPopover title="Multiples-of-N caps">
          <p>
            For each base, we count the multiples among the main numbers in
            every historical draw (e.g. multiples of 3 in 5, 12, 15, 22, 33
            is three: 12, 15, 33). The bar shows how often each count has
            appeared, with a vertical line marking the 95th-percentile cap
            used by the generator.
          </p>
          <p>
            <strong>Why it matters:</strong> draws heavy in multiples of a
            single base look &ldquo;designed&rdquo; (e.g. all even, all
            multiples of 5) and tend to be more popular human picks even
            when the math doesn&rsquo;t favour them. Capping at the
            95th-percentile keeps generated sets within the typical observed
            spread without making the rule overly aggressive.
          </p>
        </HelpPopover>
      </div>

      <div className="flex items-center gap-x-3 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="w-20 shrink-0">Base</span>
        <span className="flex-1">Distribution by count of multiples</span>
        <span className="w-12 text-right">Cap</span>
        <span className="w-20 text-right">Within cap</span>
      </div>

      <ul
        className="flex flex-col gap-y-2"
        aria-label="Multiples-of-N distribution by base"
      >
        {rows.map((r) => (
          <li
            key={r.base}
            className="flex items-center gap-x-3"
          >
            <span className="text-xs tabular-nums w-20 shrink-0 text-muted-foreground">
              × {r.base}
            </span>
            <div
              className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden flex"
              role="img"
              aria-label={`Multiples of ${r.base}: ${r.segments
                .map((s) => `${s.count}=${s.pct.toFixed(1)}%`)
                .join(", ")}; cap ≤ ${r.cap}`}
            >
              {r.segments.map((s) => (
                <div
                  key={s.count}
                  className={cn(
                    "h-full",
                    s.exceedsCap
                      ? "bg-red-500/70 dark:bg-red-400/60"
                      : "bg-sky-500/80 dark:bg-sky-400/70",
                    s.count > 0 && "border-l border-background/60",
                  )}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.count} multiples of ${r.base}: ${s.draws.toLocaleString()} draws (${s.pct.toFixed(1)}%)`}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums w-12 text-right">
              ≤ {r.cap}
            </span>
            <span className="text-xs tabular-nums w-20 text-right text-muted-foreground">
              {r.withinCapPct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-x-3 text-[10px] text-muted-foreground border-t pt-2">
        <span className="w-20 shrink-0" />
        <span className="flex-1 flex items-center gap-x-3">
          <span className="flex items-center gap-x-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500/80 dark:bg-sky-400/70" />
            within cap
          </span>
          <span className="flex items-center gap-x-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/70 dark:bg-red-400/60" />
            would be rejected
          </span>
        </span>
        <span className="w-12 text-right" />
        <span className="w-20 text-right tabular-nums">
          {drawsAnalysed.toLocaleString()} draws
        </span>
      </div>
    </Card>
  );
};
