import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type HeatCell } from "@/lib/generator";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function PositionHeatmap({
  cells,
  positions,
  positionLabels,
  minNum,
  maxNum,
  usePct = false,
}: {
  cells: HeatCell[];
  positions: number[];
  positionLabels: string[];
  minNum: number;
  maxNum: number;
  usePct?: boolean;
}) {
  const [hovered, setHovered] = useState<HeatCell | null>(null);

  const labelFor = (pos: number) => {
    const i = positions.indexOf(pos);
    return i >= 0 ? positionLabels[i] : String(pos + 1);
  };

  const cellMap = useMemo(() => {
    const m = new Map<string, HeatCell>();
    for (const c of cells) m.set(`${c.pos}-${c.num}`, c);
    return m;
  }, [cells]);

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
    const t = Math.pow((v - minVal) / denom, 0.6);
    return clamp01(t);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols + 1}, minmax(18px, 1fr))`,
          }}
        >
          <div />

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

          {positions.map((pos) => (
            <React.Fragment key={pos}>
              <div className="text-xs font-medium text-right pr-2 select-none">
                {labelFor(pos)}
              </div>

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
                      backgroundColor: `rgba(2, 132, 199, ${0.08 + 0.85 * t})`,
                    }}
                    onMouseEnter={() =>
                      setHovered(c ?? { pos, num, count: 0, pct: 0 })
                    }
                    onMouseLeave={() => setHovered(null)}
                    title={
                      c
                        ? `${labelFor(pos)}, ${num}: ${
                            usePct
                              ? `${((c.pct ?? 0) * 100).toFixed(2)}%`
                              : c.count
                          }`
                        : `${labelFor(pos)}, ${num}: 0`
                    }
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground min-h-5">
        {hovered
          ? `Position ${labelFor(hovered.pos)}, Number ${hovered.num}: ${
              usePct
                ? `${((hovered.pct ?? 0) * 100).toFixed(2)}%`
                : hovered.count
            }`
          : "Hover a cell to see details"}
      </div>
    </div>
  );
}
