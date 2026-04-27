"use client";

import { Card } from "@/components/ui/card";
import { useData } from "@/context/useDataProvider";
import { countMatchesByTier } from "@/lib/lottery-match";
import { useMemo } from "react";

interface Props {
  userMain: string[] | null;
  userLucky: string[] | null;
}

export const MatchResults = ({ userMain, userLucky }: Props) => {
  const { pastNumbers } = useData();

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
          {tiers.map(({ mainHits, luckyHits, draws }, i) => {
            const isJackpot = i === 0;
            return (
              <li
                key={`${mainHits}-${luckyHits}`}
                className={
                  "flex items-center justify-between gap-x-2 px-2 py-1 rounded-md " +
                  (isJackpot
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium"
                    : "")
                }
              >
                <span className="text-sm">
                  {mainHits} main + {luckyHits} lucky
                  {isJackpot && " (full match)"}
                </span>
                <span className="text-sm tabular-nums">
                  {draws} {draws === 1 ? "draw" : "draws"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
