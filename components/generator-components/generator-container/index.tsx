"use client";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/context/useDataProvider";
import { useGameAwareHref } from "@/hooks/use-game-aware-href";
import { useSavedNumbers } from "@/hooks/use-saved-numbers";
import {
  type GenerateValidNumberSetResult,
  type LotteryTuple,
} from "@/lib/generator";
import { countMatchesByTier } from "@/lib/lottery-match";
import { cn } from "@/lib/utils";
import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo } from "react";
import { toast } from "sonner";

interface Props {
  isGenerating: boolean;
  results: GenerateValidNumberSetResult | null;
  durationMs: number | null;
  onGenerate: () => void;
}

export const GeneratorContainer = ({
  isGenerating,
  results,
  durationMs,
  onGenerate,
}: Props) => {
  const { game, pastNumbers } = useData();
  const mainCount = game.main.count;
  const bonusLabel = game.bonus.label;
  const bonusLower = bonusLabel.toLowerCase();
  const withGame = useGameAwareHref();
  const {
    list: savedList,
    add: saveNumbers,
    remove: removeSaved,
  } = useSavedNumbers(game.id);

  const combination = results?.bestCombination ?? null;
  const currentKey = combination?.join(",") ?? null;
  const savedEntry = currentKey
    ? savedList.find((s) => s.numbers.join(",") === currentKey)
    : undefined;

  // Headline summary so the user can see "is this set worth keeping?" without
  // scrolling to the Historical Matches card. Uses the full dataset (no time
  // window) — that's the definitive answer; MatchResults still provides the
  // filtered exploration.
  const headline = useMemo(() => {
    if (!combination) return null;
    const userMain = combination.slice(0, mainCount);
    const userLucky = combination.slice(mainCount);
    const tiers = countMatchesByTier(userMain, userLucky, pastNumbers, game);
    const exact = tiers.find(
      (t) => t.mainHits === mainCount && t.luckyHits === game.bonus.count,
    );
    if (exact && exact.draws > 0) {
      return {
        kind: "jackpot" as const,
        text: `This exact combination has been drawn before — ${exact.draws} ${exact.draws === 1 ? "time" : "times"}.`,
      };
    }
    const best = tiers.find((t) => t.draws > 0);
    if (!best) {
      return {
        kind: "clean" as const,
        text: "No prize-tier match in this game's history.",
      };
    }
    return {
      kind: "partial" as const,
      text: `Best historical match: ${best.mainHits} main + ${best.luckyHits} ${bonusLower} · ${best.draws} ${best.draws === 1 ? "draw" : "draws"}.`,
    };
  }, [combination, pastNumbers, game, mainCount, bonusLower]);

  const handleToggleSave = (combo: LotteryTuple) => {
    if (savedEntry) {
      removeSaved(savedEntry.id);
      toast("Removed from saved");
    } else {
      saveNumbers(combo);
      toast.success("Saved", {
        description: "Find it on the Check Numbers page.",
      });
    }
  };

  const announcement = isGenerating
    ? "Generating numbers"
    : combination
      ? `Generated numbers: main ${combination.slice(0, mainCount).join(", ")}; ${bonusLabel.toLowerCase()} ${combination.slice(mainCount).join(", ")}.`
      : "";

  return (
    <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Generate</h3>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        aria-busy={isGenerating}
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Spinner className="size-4" aria-hidden="true" />
            Generating…
          </>
        ) : combination ? (
          "Generate again"
        ) : (
          "Generate numbers"
        )}
      </Button>

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {!combination && !isGenerating && (
        <div className="flex flex-col items-center gap-y-1.5 text-center px-2">
          <p className="text-sm text-muted-foreground">
            Click <span className="font-medium">Generate numbers</span> to draw
            a set tuned to {game.name}&apos;s historical draws.
          </p>
          <Link
            href={withGame("/about")}
            className="text-xs text-muted-foreground/80 hover:text-foreground hover:underline underline-offset-4"
          >
            What is this?
          </Link>
        </div>
      )}

      {combination && (
        <>
          <div className="flex flex-col gap-y-3">
            <Card className="p-3 lg:p-4 w-full bg-muted/30">
              <ol
                className="flex flex-wrap gap-x-2 gap-y-2 items-center justify-center"
                aria-label="Generated lottery numbers"
              >
                {combination.map((n, index) => {
                  const isMain = index < mainCount;
                  const score = results?.bestPatternProb?.[index];
                  const positionLabel = isMain
                    ? `Main ${index + 1}`
                    : `${bonusLabel} ${index - mainCount + 1}`;
                  return (
                    <Fragment key={index}>
                      {index === mainCount && (
                        <li
                          aria-hidden="true"
                          className="h-8 w-px bg-border self-center"
                        />
                      )}
                      <li className="flex items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              className={cn(
                                "inline-flex items-center justify-center size-10 md:size-11 rounded-full font-semibold text-sm md:text-base select-none",
                                "ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isMain
                                  ? "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-800"
                                  : "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-800",
                              )}
                            >
                              {n}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {positionLabel}
                            {typeof score === "number" && (
                              <> — pattern probability {score.toFixed(2)}%</>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    </Fragment>
                  );
                })}
              </ol>
            </Card>

            {headline && (
              <p
                className={cn(
                  "text-sm text-center px-2",
                  headline.kind === "jackpot"
                    ? "text-amber-700 dark:text-amber-300 font-medium"
                    : headline.kind === "clean"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                {headline.text}
              </p>
            )}

            <div className="flex gap-x-2 justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={savedEntry ? "default" : "outline"}
                    size="icon"
                    onClick={() => handleToggleSave(combination)}
                    aria-label={
                      savedEntry
                        ? "Remove from saved sets"
                        : "Save to Check Numbers"
                    }
                  >
                    {savedEntry ? <BookmarkCheckIcon /> : <BookmarkIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {savedEntry
                    ? "Saved — click to remove"
                    : "Save to Check Numbers"}
                </TooltipContent>
              </Tooltip>
              <CopyToClipboardButton txtToCopy={combination.join(", ")} />
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs md:text-sm border-t pt-3 mt-auto">
            <dt className="text-muted-foreground">Completed in</dt>
            <dd className="text-right tabular-nums">
              {durationMs ? (durationMs / 1000).toFixed(2) : "0.00"}s
            </dd>
            <dt className="text-muted-foreground">Iterations</dt>
            <dd className="text-right tabular-nums">{results?.iterations}</dd>
            <dt className="text-muted-foreground">
              Avg. positional frequency
            </dt>
            <dd className="text-right tabular-nums">
              {results?.bestScore.toFixed(2)}%
            </dd>
            <dt className="text-muted-foreground">Pair-cohesion score</dt>
            <dd className="text-right tabular-nums">
              {results?.bestPairScore.toFixed(2)}%
            </dd>
            {results?.bestRecentScore != null &&
              results.bestRecentScore > 0 && (
                <>
                  <dt className="text-muted-foreground">Recent frequency</dt>
                  <dd className="text-right tabular-nums">
                    {results.bestRecentScore.toFixed(2)}%
                  </dd>
                </>
              )}
          </dl>
        </>
      )}
    </Card>
  );
};
