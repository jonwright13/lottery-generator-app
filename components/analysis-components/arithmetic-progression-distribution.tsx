"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface DiffRow {
  diff: number;
  count: number;
  pct: number;
}

export const ArithmeticProgressionDistribution = ({ analysis }: Props) => {
  const { rows, drawsWithAp3, drawsAnalysed, ap3Pct } = useMemo(() => {
    const data = analysis.arithmeticProgressionData;
    const drawsAnalysed = data.drawsAnalysed;
    const drawsWithAp3 = data.drawsWithAp3;
    const ap3Pct = drawsAnalysed > 0 ? (drawsWithAp3 / drawsAnalysed) * 100 : 0;

    const diffs = Object.keys(data.drawsByDiff)
      .map((d) => parseInt(d, 10))
      .sort((a, b) => a - b);

    const rows: DiffRow[] = diffs.map((d) => {
      const count = data.drawsByDiff[d];
      return {
        diff: d,
        count,
        pct: drawsAnalysed > 0 ? (count / drawsAnalysed) * 100 : 0,
      };
    });

    return { rows, drawsWithAp3, drawsAnalysed, ap3Pct };
  }, [analysis.arithmeticProgressionData]);

  const maxPct = Math.max(...rows.map((r) => r.pct), 1);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Arithmetic progression (AP-3)</h2>
          <p className="text-xs text-muted-foreground">
            How often three of the five main numbers form an arithmetic
            progression (e.g. 5, 10, 15) with common difference d ≥ 2.
            Generated sets are rejected when this pattern is present; d = 1
            is already covered by the consecutive-run rule.
          </p>
        </div>
        <HelpPopover title="Arithmetic progression (AP-3)">
          <p>
            An arithmetic progression of three is any trio of numbers with a
            constant step between them: 5-10-15 (step 5), 7-13-19 (step 6),
            and so on. We scan every historical draw for any AP-3 hidden in
            the 5 main numbers and count how often each step size appears.
          </p>
          <p>
            <strong>Why it matters:</strong> these patterns occur far less
            often than random chance would suggest, partly because they look
            &ldquo;designed&rdquo; and partly because the pool isn&apos;t
            wide enough for many large-step progressions. They&apos;re also
            popular human picks. The generator rejects any candidate
            containing an AP-3 with step ≥ 2.
          </p>
        </HelpPopover>
      </div>

      <ul
        className="flex flex-col gap-y-1.5 mt-2"
        aria-label="AP-3 frequency by common difference"
      >
        {rows.length === 0 ? (
          <li className="text-xs text-muted-foreground">
            No historical draws contain an AP-3 with d ≥ 2.
          </li>
        ) : (
          rows.map((r) => {
            const widthPct = (r.pct / maxPct) * 100;
            return (
              <li key={r.diff} className="flex items-center gap-x-3">
                <span className="text-xs text-muted-foreground tabular-nums w-32 shrink-0">
                  d = {r.diff}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-24 text-right">
                  {r.count.toLocaleString()} · {r.pct.toFixed(1)}%
                </span>
              </li>
            );
          })
        )}
      </ul>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3">
        <dt className="text-muted-foreground">Draws analysed</dt>
        <dd className="text-right tabular-nums">
          {drawsAnalysed.toLocaleString()}
        </dd>
        <dt className="text-muted-foreground">Draws containing AP-3</dt>
        <dd className="text-right tabular-nums">
          {drawsWithAp3.toLocaleString()} · {ap3Pct.toFixed(1)}%
        </dd>
      </dl>
    </Card>
  );
};
