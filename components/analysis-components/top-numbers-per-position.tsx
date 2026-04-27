"use client";

import { Card } from "@/components/ui/card";
import { FIELDS } from "@/constants";
import type { ThresholdCriteria } from "@/lib/generator";
import { useMemo } from "react";

interface Props {
  analysis: ThresholdCriteria;
}

const TOP_N = 5;

interface PositionTop {
  label: string;
  total: number;
  entries: Array<{ num: string; count: number; pct: number }>;
}

export const TopNumbersPerPosition = ({ analysis }: Props) => {
  const positions = useMemo<PositionTop[]>(() => {
    return analysis.positionCounters.map((counter, idx) => {
      const total = Object.values(counter).reduce((a, b) => a + b, 0);
      const entries = Object.entries(counter)
        .map(([num, count]) => ({
          num,
          count,
          pct: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_N);
      return { label: FIELDS[idx]?.label ?? `P${idx + 1}`, total, entries };
    });
  }, [analysis.positionCounters]);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex flex-col gap-y-1">
        <h2 className="text-lg font-medium">
          Most-drawn numbers per sorted position
        </h2>
        <p className="text-xs text-muted-foreground">
          Top {TOP_N} numbers for each draw position after sorting (smallest →
          largest main, then the two lucky numbers).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
        {positions.map((pos) => (
          <div
            key={pos.label}
            className="flex flex-col gap-y-1.5 rounded-md border p-2"
          >
            <h3 className="text-xs font-medium text-muted-foreground">
              {pos.label}
            </h3>
            <ol className="flex flex-col gap-y-1">
              {pos.entries.map((e) => (
                <li
                  key={e.num}
                  className="flex items-center justify-between gap-x-2 text-xs tabular-nums"
                >
                  <span className="font-mono font-semibold">{e.num}</span>
                  <span className="text-muted-foreground">
                    {e.pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Card>
  );
};
