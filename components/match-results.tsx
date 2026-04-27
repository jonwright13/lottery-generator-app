"use client";

import {
  WINDOW_OPTIONS,
  type WindowKey,
} from "@/components/analysis-components/window-filter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useData } from "@/context/useDataProvider";
import { countMatchesByTier } from "@/lib/lottery-match";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

interface Props {
  userMain: string[] | null;
  userLucky: string[] | null;
}

const computeCutoff = (years: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

export const MatchResults = ({ userMain, userLucky }: Props) => {
  const { game, pastNumbers, dates } = useData();
  const mainCount = game.main.count;
  const bonusLabel = game.bonus.label.toLowerCase();
  const [windowKey, setWindowKey] = useState<WindowKey>("all");

  const { windowedPast, windowedDates } = useMemo(() => {
    const opt = WINDOW_OPTIONS.find((o) => o.key === windowKey);
    if (!opt || opt.years == null) {
      return { windowedPast: pastNumbers, windowedDates: dates };
    }
    const cutoff = computeCutoff(opt.years);
    const idx: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] >= cutoff) idx.push(i);
    }
    return {
      windowedPast: idx.map((i) => pastNumbers[i]),
      windowedDates: idx.map((i) => dates[i]),
    };
  }, [pastNumbers, dates, windowKey]);

  const tiers = useMemo(
    () =>
      userMain && userLucky
        ? countMatchesByTier(userMain, userLucky, windowedPast, game)
        : null,
    [userMain, userLucky, windowedPast, game],
  );

  const userMainSet = useMemo(() => new Set(userMain ?? []), [userMain]);
  const userLuckySet = useMemo(() => new Set(userLucky ?? []), [userLucky]);

  return (
    <Card className="flex flex-col gap-y-2 p-4 w-full h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Historical matches</h3>
        <div
          role="group"
          aria-label="Historical window"
          className="inline-flex rounded-md border p-0.5"
        >
          {WINDOW_OPTIONS.map((opt) => {
            const active = opt.key === windowKey;
            return (
              <Button
                key={opt.key}
                type="button"
                size="sm"
                variant={active ? "default" : "ghost"}
                aria-pressed={active}
                onClick={() => setWindowKey(opt.key)}
                className="h-7 px-3 text-xs"
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>
      {!tiers ? (
        <p className="text-sm text-muted-foreground">
          Fill in all numbers to see how often each prize tier has been drawn.
        </p>
      ) : (
        <ul className="flex flex-col gap-y-1">
          {tiers.map(({ mainHits, luckyHits, draws, drawIndices }, i) => {
            const isJackpot = i === 0;
            const label = `${draws} ${draws === 1 ? "draw" : "draws"}`;
            const rowCls =
              "flex items-center justify-between gap-x-2 px-2 py-1 rounded-md " +
              (isJackpot
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium"
                : "");
            return (
              <li key={`${mainHits}-${luckyHits}`} className={rowCls}>
                <span className="text-sm">
                  {mainHits} main + {luckyHits} {bonusLabel}
                  {isJackpot && " (full match)"}
                </span>
                {draws === 0 ? (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {label}
                  </span>
                ) : (
                  <Popover>
                    <PopoverTrigger
                      className="text-sm tabular-nums underline-offset-2 hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                      title="Show dates"
                    >
                      {label}
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-80 max-h-80 overflow-auto"
                    >
                      <p className="text-xs font-medium mb-2">
                        {mainHits} main + {luckyHits} {bonusLabel} · {label}
                      </p>
                      <ul className="flex flex-col gap-y-2">
                        {drawIndices
                          .slice()
                          .sort((a, b) =>
                            windowedDates[a] < windowedDates[b]
                              ? 1
                              : windowedDates[a] > windowedDates[b]
                                ? -1
                                : 0,
                          )
                          .map((idx) => {
                            const draw = windowedPast[idx];
                            return (
                              <li key={idx} className="flex flex-col gap-y-1">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {new Date(
                                    windowedDates[idx],
                                  ).toLocaleDateString()}
                                </span>
                                <ul className="flex gap-x-1 font-mono text-xs tabular-nums">
                                  {draw.map((n, j) => {
                                    const isMain = j < mainCount;
                                    const matched = isMain
                                      ? userMainSet.has(n)
                                      : userLuckySet.has(n);
                                    return (
                                      <li
                                        key={j}
                                        className={cn(
                                          "w-7 text-center rounded-sm py-0.5",
                                          matched
                                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold"
                                            : "bg-muted text-muted-foreground",
                                        )}
                                      >
                                        {n}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </li>
                            );
                          })}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
