"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface Entry {
  num: number;
  count: number;
  isTop: boolean;
}

const MAIN_RANGE = { min: 1, max: 50, slots: [0, 1, 2, 3, 4] };
const LUCKY_RANGE = { min: 1, max: 11, slots: [5, 6] };
const TOP_HIGHLIGHT = 5;

const buildEntries = (
  counters: Array<Record<string, number>>,
  slots: number[],
  min: number,
  max: number,
): Entry[] => {
  const totals = new Map<number, number>();
  for (const slot of slots) {
    const counter = counters[slot] ?? {};
    for (const [k, v] of Object.entries(counter)) {
      const num = parseInt(k, 10);
      totals.set(num, (totals.get(num) ?? 0) + v);
    }
  }
  const sortedByCount = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const topSet = new Set(sortedByCount.slice(0, TOP_HIGHLIGHT).map(([n]) => n));

  const entries: Entry[] = [];
  for (let n = min; n <= max; n++) {
    entries.push({
      num: n,
      count: totals.get(n) ?? 0,
      isTop: topSet.has(n),
    });
  }
  return entries;
};

const FrequencyBars = ({
  entries,
  ariaLabel,
}: {
  entries: Entry[];
  ariaLabel: string;
}) => {
  const max = Math.max(...entries.map((e) => e.count), 1);
  const total = entries.reduce((acc, e) => acc + e.count, 0);
  return (
    <div className="flex flex-col gap-y-1">
      <ul className="flex items-end gap-x-[2px] h-32" aria-label={ariaLabel}>
        {entries.map((e) => {
          const heightPct = (e.count / max) * 100;
          const pct = total > 0 ? (e.count / total) * 100 : 0;
          return (
            <li
              key={e.num}
              className="flex flex-col items-center justify-end flex-1 h-full"
              title={`${String(e.num).padStart(2, "0")}: ${e.count.toLocaleString()} (${pct.toFixed(1)}%)`}
            >
              <div
                className={cn(
                  "w-full rounded-sm",
                  e.isTop
                    ? "bg-sky-500/80 dark:bg-sky-400/70"
                    : "bg-muted-foreground/30",
                )}
                style={{ height: `${heightPct}%` }}
              />
            </li>
          );
        })}
      </ul>
      <ul className="flex gap-x-[2px] text-[9px] text-muted-foreground tabular-nums">
        {entries.map((e) => (
          <li
            key={e.num}
            className={cn(
              "flex-1 text-center",
              e.isTop && "text-foreground font-medium",
            )}
          >
            {e.num}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const NumberFrequency = ({ analysis }: Props) => {
  const { mainEntries, luckyEntries } = useMemo(
    () => ({
      mainEntries: buildEntries(
        analysis.positionCounters,
        MAIN_RANGE.slots,
        MAIN_RANGE.min,
        MAIN_RANGE.max,
      ),
      luckyEntries: buildEntries(
        analysis.positionCounters,
        LUCKY_RANGE.slots,
        LUCKY_RANGE.min,
        LUCKY_RANGE.max,
      ),
    }),
    [analysis.positionCounters],
  );

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Overall number frequency</h2>
          <p className="text-xs text-muted-foreground">
            How often each number has appeared in any main slot (
            {MAIN_RANGE.min}–{MAIN_RANGE.max}) and any lucky slot (
            {LUCKY_RANGE.min}–{LUCKY_RANGE.max}). Top {TOP_HIGHLIGHT} per group
            are highlighted.
          </p>
        </div>
        <HelpPopover title="Overall number frequency">
          <p>
            For every ball, this counts how many historical draws it has
            appeared in — across all main slots for the main pool and across
            both lucky slots for the lucky pool. The {TOP_HIGHLIGHT} most-drawn
            balls in each pool are highlighted.
          </p>
          <p>
            <strong>Why it matters:</strong> in a fair draw every number is
            equally likely, but real-world results drift around that average.
            This view surfaces which balls have run hot or cold over the full
            history and is the simplest baseline behind &ldquo;hot
            number&rdquo; thinking — useful as a sanity check rather than a
            prediction.
          </p>
        </HelpPopover>
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Main numbers
        </h3>
        <FrequencyBars
          entries={mainEntries}
          ariaLabel="Main number overall frequency"
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Lucky numbers
        </h3>
        <FrequencyBars
          entries={luckyEntries}
          ariaLabel="Lucky number overall frequency"
        />
      </div>
    </Card>
  );
};
