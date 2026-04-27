"use client";

import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useData } from "@/context/useDataProvider";
import { countMatchesByTier } from "@/lib/lottery-match";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  userMain: string[] | null;
  userLucky: string[] | null;
}

const MAIN_COUNT = 5;

export const MatchResults = ({ userMain, userLucky }: Props) => {
  const { pastNumbers, dates } = useData();

  const tiers = useMemo(
    () =>
      userMain && userLucky
        ? countMatchesByTier(userMain, userLucky, pastNumbers)
        : null,
    [userMain, userLucky, pastNumbers],
  );

  const userMainSet = useMemo(() => new Set(userMain ?? []), [userMain]);
  const userLuckySet = useMemo(() => new Set(userLucky ?? []), [userLucky]);

  return (
    <Card className="flex flex-col gap-y-2 p-4 w-full h-full">
      <h3 className="text-lg font-semibold">Historical matches</h3>
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
                  {mainHits} main + {luckyHits} lucky
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
                        {mainHits} main + {luckyHits} lucky · {label}
                      </p>
                      <ul className="flex flex-col gap-y-2">
                        {drawIndices
                          .slice()
                          .sort((a, b) =>
                            dates[a] < dates[b]
                              ? 1
                              : dates[a] > dates[b]
                                ? -1
                                : 0,
                          )
                          .map((idx) => {
                            const draw = pastNumbers[idx];
                            return (
                              <li key={idx} className="flex flex-col gap-y-1">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {new Date(dates[idx]).toLocaleDateString()}
                                </span>
                                <ul className="flex gap-x-1 font-mono text-xs tabular-nums">
                                  {draw.map((n, j) => {
                                    const isMain = j < MAIN_COUNT;
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
