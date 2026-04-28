"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type WindowKey = "all" | "10y" | "5y" | "1y" | "6m" | "custom";

export const WINDOW_OPTIONS: ReadonlyArray<{
  key: WindowKey;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "10y", label: "10y" },
  { key: "5y", label: "5y" },
  { key: "1y", label: "1y" },
  { key: "6m", label: "6m" },
  { key: "custom", label: "Custom" },
];

const VALID_KEYS = new Set(WINDOW_OPTIONS.map((o) => o.key));

export const isWindowKey = (v: string | null): v is WindowKey =>
  v !== null && VALID_KEYS.has(v as WindowKey);

const yearsAgoISO = (n: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
};

const monthsAgoISO = (n: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

const todayISO = (): string => new Date().toISOString().slice(0, 10);

/**
 * Resolves the active window key (and optional custom range) into a
 * pair of inclusive date bounds for filtering. `null` means unbounded.
 */
export const resolveWindowBounds = (
  windowKey: WindowKey,
  customFrom: string | null,
  customTo: string | null,
): { from: string | null; to: string | null } => {
  switch (windowKey) {
    case "all":
      return { from: null, to: null };
    case "10y":
      return { from: yearsAgoISO(10), to: null };
    case "5y":
      return { from: yearsAgoISO(5), to: null };
    case "1y":
      return { from: yearsAgoISO(1), to: null };
    case "6m":
      return { from: monthsAgoISO(6), to: null };
    case "custom":
      return { from: customFrom, to: customTo };
  }
};

/** Default custom range when the user first picks "Custom". */
export const seedCustomRange = (): { from: string; to: string } => ({
  from: monthsAgoISO(6),
  to: todayISO(),
});

interface Props {
  value: WindowKey;
  onChange: (key: WindowKey) => void;
  totalDraws: number;
  windowedDraws: number;
  windowStart: string | null;
  windowEnd: string | null;
  customFrom: string | null;
  customTo: string | null;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
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
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: Props) => {
  const range = formatRange(windowStart, windowEnd);
  const showCustomInputs = value === "custom";

  return (
    <div className="flex flex-col gap-y-3 rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-y-0.5">
          <span className="text-sm font-medium">Historical window</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {windowedDraws.toLocaleString()} of {totalDraws.toLocaleString()}{" "}
            draws
            {range && <> · {range}</>}
          </span>
        </div>
        <div
          role="group"
          aria-label="Historical window"
          className="inline-flex flex-wrap rounded-md border p-0.5"
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

      {showCustomInputs && (
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <div className="flex flex-col gap-y-1">
            <Label
              htmlFor="window-from"
              className="text-xs text-muted-foreground"
            >
              From
            </Label>
            <Input
              id="window-from"
              type="date"
              value={customFrom ?? ""}
              max={customTo ?? undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label
              htmlFor="window-to"
              className="text-xs text-muted-foreground"
            >
              To
            </Label>
            <Input
              id="window-to"
              type="date"
              value={customTo ?? ""}
              min={customFrom ?? undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          {(!customFrom || !customTo) && (
            <span className="text-xs text-muted-foreground pb-1.5">
              Pick both dates to apply the filter.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
