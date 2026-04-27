"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";

interface Props {
  analysis: ThresholdCriteria;
}

export const OddEvenDistribution = ({ analysis }: Props) => {
  const rows = analysis.distribution;
  const maxPct = Math.max(...rows.map((r) => r.pct), 1);
  const [lo, hi] = analysis.oddRange;

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">
            Odd / even split (main numbers)
          </h2>
          <p className="text-xs text-muted-foreground">
            Share of draws by odd-number count among the 5 main numbers.
            Highlighted rows fall inside the observed odd-count range ({lo}–
            {hi}).
          </p>
        </div>
        <HelpPopover title="Odd / even split">
          <p>
            For each historical draw we count how many of the 5 main numbers
            are odd (so the even count is just 5 minus that). Most real draws
            fall in the middle — usually 1 to 4 odds. All-odd or all-even sets
            are rare even though there&apos;s no physical reason they should
            be.
          </p>
          <p>
            <strong>Why it matters:</strong> picking an all-odd or all-even
            set isn&apos;t any less likely to win, but it&apos;s the kind of
            shape lots of other people pick (e.g. all dates), so a jackpot
            would more often be shared. The generator keeps the odd count
            inside the historically observed range to avoid those extremes.
          </p>
        </HelpPopover>
      </div>

      <ul
        className="flex flex-col gap-y-1.5 mt-2"
        aria-label="Odd-even distribution"
      >
        {rows.map((row) => {
          const inRange = row.oddCount >= lo && row.oddCount <= hi;
          const widthPct = (row.pct / maxPct) * 100;
          return (
            <li key={row.oddCount} className="flex items-center gap-x-3">
              <span className="text-xs text-muted-foreground tabular-nums w-28 shrink-0">
                {row.label}
              </span>
              <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-sm",
                    inRange
                      ? "bg-sky-500/80 dark:bg-sky-400/70"
                      : "bg-muted-foreground/30",
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-20 text-right">
                {row.count.toLocaleString()} · {row.pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
