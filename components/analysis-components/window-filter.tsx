"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WindowKey = "all" | "5y" | "1y";

export const WINDOW_OPTIONS: ReadonlyArray<{
  key: WindowKey;
  label: string;
  years: number | null;
}> = [
  { key: "all", label: "All time", years: null },
  { key: "5y", label: "Last 5 years", years: 5 },
  { key: "1y", label: "Last year", years: 1 },
];

export const isWindowKey = (v: string | null): v is WindowKey =>
  v === "all" || v === "5y" || v === "1y";

interface Props {
  value: WindowKey;
  onChange: (key: WindowKey) => void;
  totalDraws: number;
  windowedDraws: number;
  windowStart: string | null;
  windowEnd: string | null;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const formatRange = (start: string | null, end: string | null): string => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  return `${dateFormatter.format(s)} – ${dateFormatter.format(e)}`;
};

export const WindowFilter = ({
  value,
  onChange,
  totalDraws,
  windowedDraws,
  windowStart,
  windowEnd,
}: Props) => {
  const range = formatRange(windowStart, windowEnd);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div className="flex flex-col gap-y-0.5">
        <span className="text-sm font-medium">Historical window</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {windowedDraws.toLocaleString()} of {totalDraws.toLocaleString()} draws
          {range && <> · {range}</>}
        </span>
      </div>
      <div
        role="group"
        aria-label="Historical window"
        className="inline-flex rounded-md border p-0.5"
      >
        {WINDOW_OPTIONS.map((opt) => {
          const active = opt.key === value;
          return (
            <Button
              key={opt.key}
              type="button"
              size="sm"
              variant={active ? "default" : "ghost"}
              aria-pressed={active}
              onClick={() => onChange(opt.key)}
              className={cn("h-7 px-3 text-xs")}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
