"use client";

import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import type { ThresholdCriteria } from "@/lib/generator";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

interface PatternRow {
  key: string;
  label: string;
  countMain: number;
  countLucky: number;
  special: number | null;
  pct: number;
}

const parsePatternKey = (
  key: string,
): { countMain: number; countLucky: number; special: number | null } => {
  // Format: "<m>_main+<l>_lucky" or "<m>_main+1_lucky_special_<n>"
  const match = key.match(
    /^(\d+)_main\+(\d+)_lucky(?:_special_(\d+))?$/,
  );
  if (!match) return { countMain: 0, countLucky: 0, special: null };
  return {
    countMain: parseInt(match[1], 10),
    countLucky: parseInt(match[2], 10),
    special: match[3] ? parseInt(match[3], 10) : null,
  };
};

const formatLabel = (
  countMain: number,
  countLucky: number,
  special: number | null,
): string => {
  const main = `${countMain} main`;
  if (countLucky === 0) return main;
  if (special !== null && countLucky === 1) {
    return `${main} + lucky #${special}`;
  }
  return `${main} + ${countLucky} lucky`;
};

export const MaxPatternProbabilities = ({ analysis }: Props) => {
  const rows = useMemo<PatternRow[]>(() => {
    const out: PatternRow[] = [];
    for (const [key, pct] of Object.entries(analysis.maxPatternProbs)) {
      const { countMain, countLucky, special } = parsePatternKey(key);
      out.push({
        key,
        label: formatLabel(countMain, countLucky, special),
        countMain,
        countLucky,
        special,
        pct,
      });
    }
    out.sort((a, b) => {
      if (b.countMain !== a.countMain) return b.countMain - a.countMain;
      if (b.countLucky !== a.countLucky) return b.countLucky - a.countLucky;
      return (a.special ?? 0) - (b.special ?? 0);
    });
    return out;
  }, [analysis.maxPatternProbs]);

  const maxPct = Math.max(...rows.map((r) => r.pct), 0.0001);

  return (
    <Card className="flex flex-col gap-y-4 p-4 w-full">
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">Max pattern probabilities</h2>
          <p className="text-xs text-muted-foreground">
            For each prize-style pattern, the average per-position chance you
            would have hit it by always picking each position&rsquo;s
            historically most-frequent number. A diagnostic of how much
            positional bias the data carries — not a win-rate prediction.
          </p>
        </div>
        <HelpPopover title="Max pattern probabilities">
          <p>
            For every position in a draw (main 1, main 2, …, lucky 1, lucky 2)
            we find the single number that has appeared in that slot more
            often than any other. The percentage shown for each pattern is the
            average of those per-position rates over the slots the pattern
            covers.
          </p>
          <p>
            <strong>What it tells you:</strong> if these numbers are uniformly
            high, the data has strong positional bias and the generator&rsquo;s
            position-frequency score has more signal to work with. If
            they&rsquo;re flat, the per-position distribution is close to
            uniform and that score is doing little.
          </p>
          <p>
            <strong>What it does NOT tell you:</strong> these are averages of
            per-position chances, not joint pattern probabilities. The actual
            chance of matching a 5+2 in any given draw is much lower than the
            number shown here.
          </p>
        </HelpPopover>
      </div>

      <ul
        className="flex flex-col gap-y-1.5"
        aria-label="Max pattern probabilities by pattern"
      >
        {rows.length === 0 ? (
          <li className="text-xs text-muted-foreground">
            No pattern data available.
          </li>
        ) : (
          rows.map((r) => {
            const widthPct = (r.pct / maxPct) * 100;
            return (
              <li key={r.key} className="flex items-center gap-x-3">
                <span className="text-xs text-muted-foreground tabular-nums w-32 shrink-0">
                  {r.label}
                </span>
                <div className="relative flex-1 h-5 rounded-sm bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-400/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-16 text-right">
                  {r.pct.toFixed(2)}%
                </span>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
};
