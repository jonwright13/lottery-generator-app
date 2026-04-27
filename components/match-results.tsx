"use client";

import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useData } from "@/context/useDataProvider";
import { countMatchesByTier } from "@/lib/lottery-match";
import { useMemo } from "react";

interface Props {
  userMain: string[] | null;
  userLucky: string[] | null;
}

export const MatchResults = ({ userMain, userLucky }: Props) => {
  const { pastNumbers, dates } = useData();

  const tiers = useMemo(
    () =>
      userMain && userLucky
        ? countMatchesByTier(userMain, userLucky, pastNumbers)
        : null,
    [userMain, userLucky, pastNumbers],
  );

  return (
    <Card className="flex flex-col gap-y-2 p-4 w-full">
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
              <li
                key={`${mainHits}-${luckyHits}`}
                className={rowCls}
              >
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
                      className="w-64 max-h-72 overflow-auto"
                    >
                      <p className="text-xs font-medium mb-2">
                        {mainHits} main + {luckyHits} lucky · {label}
                      </p>
                      <ul className="flex flex-col gap-y-1 text-xs tabular-nums">
                        {drawIndices
                          .map((idx) => dates[idx])
                          .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                          .map((d, j) => (
                            <li key={j}>
                              {new Date(d).toLocaleDateString()}
                            </li>
                          ))}
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
