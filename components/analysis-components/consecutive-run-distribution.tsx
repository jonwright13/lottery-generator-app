"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface RunRow {
  length: number;
  draws: number;
  pct: number;
  rejected: boolean;
}

// Mirrors the generator's hard rule: any longest-run ≥ 3 is rejected. Used to
// shade rows in the table so the user can see how strict the rule actually is.
const RUN_REJECT_THRESHOLD = 3;

export const ConsecutiveRunDistribution = ({ analysis }: Props) => {
  const { rows, drawsAnalysed, drawsKept, drawsRejected } = useMemo(() => {
    const data = analysis.consecutiveRunData;
    const total = data.drawsAnalysed;
    const lengths = Object.keys(data.byLength)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    const rows: RunRow[] = lengths.map((length) => {
      const draws = data.byLength[length] ?? 0;
      return {
        length,
        draws,
        pct: total > 0 ? (draws / total) * 100 : 0,
        rejected: length >= RUN_REJECT_THRESHOLD,
      };
    });

    let kept = 0;
    let rejected = 0;
    for (const r of rows) {
      if (r.rejected) rejected += r.draws;
      else kept += r.draws;
    }

    return {
      rows,
      drawsAnalysed: total,
      drawsKept: kept,
      drawsRejected: rejected,
    };
  }, [analysis.consecutiveRunData]);

  const maxPct = Math.max(...rows.map((r) => r.pct), 1);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">
            Consecutive-run distribution
          </h2>
          <p className="text-xs text-muted-foreground">
            How long the longest run of consecutive numbers has been in each
            historical draw. The generator rejects any candidate set whose
            longest run is ≥ {RUN_REJECT_THRESHOLD}.
          </p>
        </div>
        <HelpPopover title="Consecutive-run distribution">
          <p>
            For every historical draw we sort the main numbers ascending and
            measure the longest stretch of consecutive integers (e.g. 17, 18,
            19 is a run of 3; 5, 7, 9 is a run of 1 since none are
            consecutive).
          </p>
          <p>
            <strong>Why it matters:</strong> long runs are rare in random
            draws and even rarer in the historical record. The generator
            uses this as a hard rule: any candidate set whose longest run is
            ≥ {RUN_REJECT_THRESHOLD} is discarded outright. Highlighted rows
            below show how many historical draws would <em>also</em> have
            been discarded by that rule.
          </p>
        </HelpPopover>
      </div>

      <div className="flex flex-col gap-y-2">
        <ul
          className="flex flex-col gap-y-1.5"
          aria-label="Distribution of longest consecutive run by draw"
        >
          {rows.map((r) => {
            const widthPct = (r.pct / maxPct) * 100;
            return (
              <li
                key={r.length}
                className="flex items-center gap-x-3"
              >
                <span
                  className={cn(
                    "text-xs tabular-nums w-28 shrink-0",
                    r.rejected
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  Run of {r.length}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-sm",
                      r.rejected
                        ? "bg-red-500/70 dark:bg-red-400/60"
                        : "bg-sky-500/80 dark:bg-sky-400/70",
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-24 text-right">
                  {r.draws.toLocaleString()} · {r.pct.toFixed(1)}%
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
        <dt className="text-muted-foreground">Would pass the run rule</dt>
        <dd className="text-right tabular-nums">
          {drawsKept.toLocaleString()}
          {drawsAnalysed > 0 && (
            <span className="text-muted-foreground">
              {" "}
              ({((drawsKept / drawsAnalysed) * 100).toFixed(1)}%)
            </span>
          )}
        </dd>
        <dt className="text-muted-foreground">Would be rejected</dt>
        <dd className="text-right tabular-nums">
          {drawsRejected.toLocaleString()}
          {drawsAnalysed > 0 && (
            <span className="text-muted-foreground">
              {" "}
              ({((drawsRejected / drawsAnalysed) * 100).toFixed(1)}%)
            </span>
          )}
        </dd>
      </dl>
    </Card>
  );
};
