import React, { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type HeatCell, type LotteryTuple } from "@/lib/generator";
import { cn } from "@/lib/utils";

const drillDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

interface CellMatch {
  date: string;
  draw: LotteryTuple;
}

const RECENT_MATCH_LIMIT = 8;

function findRecentMatches(
  pos: number,
  num: number,
  pastNumbers: LotteryTuple[],
  dates: string[],
): CellMatch[] {
  const out: CellMatch[] = [];
  // pastNumbers is newest-first (see scripts/data-sources.mjs), so the first
  // hits we collect are also the most recent.
  for (let i = 0; i < pastNumbers.length && out.length < RECENT_MATCH_LIMIT; i++) {
    if (Number(pastNumbers[i][pos]) === num) {
      out.push({ date: dates[i], draw: pastNumbers[i] });
    }
  }
  return out;
}

function formatDate(d: string): string {
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? d : drillDateFormatter.format(parsed);
}

export function PositionHeatmap({
  cells,
  positions,
  positionLabels,
  minNum,
  maxNum,
  usePct = false,
  pastNumbers,
  dates,
  mainCount,
}: {
  cells: HeatCell[];
  positions: number[];
  positionLabels: string[];
  minNum: number;
  maxNum: number;
  usePct?: boolean;
  pastNumbers: LotteryTuple[];
  dates: string[];
  mainCount: number;
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
                const cellOrZero = c ?? { pos, num, count: 0, pct: 0 };

                return (
                  <HeatmapCell
                    key={`${pos}-${num}`}
                    pos={pos}
                    num={num}
                    cell={cellOrZero}
                    posLabel={labelFor(pos)}
                    intensity={t}
                    usePct={usePct}
                    pastNumbers={pastNumbers}
                    dates={dates}
                    mainCount={mainCount}
                    onHoverChange={setHovered}
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
          : "Hover or focus a cell to see details, click for recent matches"}
      </div>
    </div>
  );
}

function HeatmapCell({
  pos,
  num,
  cell,
  posLabel,
  intensity,
  usePct,
  pastNumbers,
  dates,
  mainCount,
  onHoverChange,
}: {
  pos: number;
  num: number;
  cell: HeatCell;
  posLabel: string;
  intensity: number;
  usePct: boolean;
  pastNumbers: LotteryTuple[];
  dates: string[];
  mainCount: number;
  onHoverChange: (c: HeatCell | null) => void;
}) {
  const valueLabel = usePct
    ? `${((cell.pct ?? 0) * 100).toFixed(2)}%`
    : `${cell.count} draw${cell.count === 1 ? "" : "s"}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Position ${posLabel}, number ${num}: ${valueLabel}. Click for recent draws.`}
          className={cn(
            "h-5 w-full rounded-[2px] border border-transparent",
            "focus:outline-none focus:ring-2 focus:ring-slate-400",
          )}
          style={{
            backgroundColor: `rgba(2, 132, 199, ${0.08 + 0.85 * intensity})`,
          }}
          onMouseEnter={() => onHoverChange(cell)}
          onMouseLeave={() => onHoverChange(null)}
          onFocus={() => onHoverChange(cell)}
          onBlur={() => onHoverChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 text-sm" align="center">
        <DrillDownContent
          pos={pos}
          num={num}
          posLabel={posLabel}
          cell={cell}
          totalDraws={pastNumbers.length}
          pastNumbers={pastNumbers}
          dates={dates}
          mainCount={mainCount}
        />
      </PopoverContent>
    </Popover>
  );
}

function DrillDownContent({
  pos,
  num,
  posLabel,
  cell,
  totalDraws,
  pastNumbers,
  dates,
  mainCount,
}: {
  pos: number;
  num: number;
  posLabel: string;
  cell: HeatCell;
  totalDraws: number;
  pastNumbers: LotteryTuple[];
  dates: string[];
  mainCount: number;
}) {
  // Only computed when the popover opens (Radix mounts content lazily).
  const matches = useMemo(
    () => findRecentMatches(pos, num, pastNumbers, dates),
    [pos, num, pastNumbers, dates],
  );

  const pctText = `${((cell.pct ?? 0) * 100).toFixed(2)}%`;

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-col gap-y-0.5">
        <h4 className="font-medium">
          Position {posLabel}, Number {num}
        </h4>
        <p className="text-xs text-muted-foreground">
          Drawn in this slot {cell.count} of {totalDraws} draws ({pctText}).
        </p>
      </div>
      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Never drawn in this slot.
        </p>
      ) : (
        <div className="flex flex-col gap-y-1.5">
          <p className="text-xs text-muted-foreground">
            Most recent {matches.length === 1 ? "draw" : `${matches.length} draws`}:
          </p>
          <ul className="flex flex-col gap-y-1 max-h-44 overflow-y-auto">
            {matches.map((m, idx) => {
              const main = m.draw.slice(0, mainCount).join(" ");
              const bonus = m.draw.slice(mainCount).join(" ");
              return (
                <li
                  key={`${m.date}-${idx}`}
                  className="text-xs leading-relaxed"
                >
                  <span className="text-muted-foreground tabular-nums">
                    {formatDate(m.date)}
                  </span>{" "}
                  <span className="tabular-nums">{main}</span>
                  {bonus && (
                    <>
                      {" + "}
                      <span className="tabular-nums text-amber-700 dark:text-amber-300">
                        {bonus}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
