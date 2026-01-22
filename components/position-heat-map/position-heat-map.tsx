import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type HeatCell } from "@/lib/generator";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function PositionHeatmap({
  cells,
  numPositions,
  minNum,
  maxNum,
  usePct = false,
}: {
  cells: HeatCell[];
  numPositions: number;
  minNum: number;
  maxNum: number;
  usePct?: boolean; // set true if you pass normalized cells w/ pct
}) {
  const [hovered, setHovered] = useState<HeatCell | null>(null);

  // Index for O(1) lookup by (pos,num)
  const cellMap = useMemo(() => {
    const m = new Map<string, HeatCell>();
    for (const c of cells) m.set(`${c.pos}-${c.num}`, c);
    return m;
  }, [cells]);

  // Scale range
  const { minVal, maxVal } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const c of cells) {
      const v = usePct ? (c.pct ?? 0) : c.count;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    if (!Number.isFinite(minVal)) minVal = 0;
    if (!Number.isFinite(maxVal)) maxVal = 1;

    return { minVal, maxVal };
  }, [cells, usePct]);

  const cols = maxNum - minNum + 1;

  const getIntensity = (c: HeatCell | undefined) => {
    const v = usePct ? (c?.pct ?? 0) : (c?.count ?? 0);
    const denom = maxVal - minVal || 1;
    // gamma curve makes contrast nicer
    const t = Math.pow((v - minVal) / denom, 0.6);
    return clamp01(t);
  };

  return (
    <div className="space-y-4">
      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols + 1}, minmax(18px, 1fr))`, // +1 for row label column
          }}
        >
          {/* Top-left blank */}
          <div />

          {/* Column labels */}
          {Array.from({ length: cols }, (_, i) => {
            const n = minNum + i;
            return (
              <div
                key={n}
                className="text-[10px] text-muted-foreground text-center select-none"
              >
                {n}
              </div>
            );
          })}

          {/* Rows */}
          {Array.from({ length: numPositions }, (_, pos) => (
            <React.Fragment key={pos}>
              {/* Row label */}
              <div className="text-xs font-medium text-right pr-2 select-none">
                {pos + 1 <= 5 ? "N" : "L"}
                {pos + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: cols }, (_, i) => {
                const num = minNum + i;
                const c = cellMap.get(`${pos}-${num}`);
                const t = getIntensity(c);

                return (
                  <button
                    key={`${pos}-${num}`}
                    type="button"
                    className={cn(
                      "h-5 w-full rounded-[2px] border border-transparent",
                      "focus:outline-none focus:ring-2 focus:ring-slate-400",
                    )}
                    style={{
                      // intensity -> background alpha (simple + effective)
                      backgroundColor: `rgba(2, 132, 199, ${0.08 + 0.85 * t})`,
                    }}
                    onMouseEnter={() =>
                      setHovered(c ?? { pos, num, count: 0, pct: 0 })
                    }
                    onMouseLeave={() => setHovered(null)}
                    title={
                      c
                        ? `${pos + 1 <= 5 ? "N" : "L"}${pos + 1}, ${num}: ${
                            usePct
                              ? `${((c.pct ?? 0) * 100).toFixed(2)}%`
                              : c.count
                          }`
                        : `${pos + 1 <= 5 ? "N" : "L"}${pos + 1}, ${num}: 0`
                    }
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Simple hover readout */}
      <div className="text-sm text-muted-foreground min-h-5">
        {hovered
          ? `Position ${hovered.pos + 1 <= 5 ? "N" : "L"}${hovered.pos + 1}, Number ${hovered.num}: ${
              usePct
                ? `${((hovered.pct ?? 0) * 100).toFixed(2)}%`
                : hovered.count
            }`
          : "Hover a cell to see details"}
      </div>
    </div>
  );
}
