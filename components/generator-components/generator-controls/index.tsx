"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/context/useDataProvider";
import {
  countQualifyingDraws,
  ThresholdCriteria,
  type GenerateValidNumberSetOptions,
  type UpdateOptions,
} from "@/lib/generator";
import { cn } from "@/lib/utils";
import { RotateCcwIcon } from "lucide-react";
import { useMemo } from "react";
import { GeneratorProps } from "../types";
import {
  ClusterMaxItem,
  GapDistributionItem,
  LastDigitItem,
  MaxIterationsItem,
  MinMaxSumItem,
  OddEvenDistItem,
  PairScoreWeightItem,
  PositionalFrequencyScoreItem,
  PreviousDrawOverlapItem,
  RecentBiasItem,
  TripletScoreWeightItem,
} from "./accordion-items";

interface Props extends GeneratorProps {
  analysis: ThresholdCriteria | null;
  updateOptions: UpdateOptions;
}

type NumericOptionKey = {
  [K in keyof GenerateValidNumberSetOptions]: GenerateValidNumberSetOptions[K] extends number
    ? K
    : never;
}[keyof GenerateValidNumberSetOptions];

const TriggerRow = ({
  label,
  helper,
  value,
  modified,
}: {
  label: string;
  helper?: string;
  value: string;
  modified?: boolean;
}) => (
  <span className="flex w-full items-start justify-between gap-3 pr-2">
    <span className="flex flex-col gap-y-0.5 text-left">
      <span>{label}</span>
      {helper && (
        <span className="text-xs text-muted-foreground/80 font-normal">
          {helper}
        </span>
      )}
    </span>
    <span className="flex items-center gap-x-1.5 shrink-0 pt-0.5">
      {modified && (
        <span
          aria-label="Modified from default"
          title="Modified from default"
          className="size-1.5 rounded-full bg-amber-500"
        />
      )}
      <span className="text-muted-foreground tabular-nums font-normal text-xs">
        {value}
      </span>
    </span>
  </span>
);

export const GeneratorControls = ({
  analysis,
  genOptions,
  updateOptions,
}: Props) => {
  const { game, pastNumbers, seededOptions, resetOptions, isAtDefaults } =
    useData();
  const bonusLabel = game.bonus.label.toLowerCase();
  const showBonusGap = game.bonus.count > 1;

  // Live "of N historical draws, how many would pass the current constraint
  // set" — recomputes whenever any threshold changes. ~3-5 ms across all four
  // games, so it's safe on every option keystroke.
  const qualifying = useMemo(
    () => countQualifyingDraws(pastNumbers, genOptions),
    [pastNumbers, genOptions],
  );
  const qualifyingPct =
    qualifying.total > 0 ? (qualifying.pass / qualifying.total) * 100 : 0;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!analysis) return;
    // Inputs in this surface only drive numeric option keys.
    const name = e.target.name as NumericOptionKey;
    updateOptions(name, Number(e.target.value));
  };

  // True when any of the named keys differs from its data-derived seeded
  // value. JSON.stringify handles the tuple/object-valued keys (oddRange,
  // maxMultiplesAllowed) without a custom comparator.
  const isModified = (...keys: Array<keyof GenerateValidNumberSetOptions>) =>
    keys.some(
      (k) => JSON.stringify(genOptions[k]) !== JSON.stringify(seededOptions[k]),
    );

  return (
    <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full h-full">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h3 className="text-lg font-semibold">Controls</h3>
        <div className="flex items-center gap-x-2">
          {qualifying.total > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "text-xs tabular-nums cursor-default",
                    qualifyingPct >= 25
                      ? "text-muted-foreground"
                      : qualifyingPct >= 5
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400",
                  )}
                  aria-live="polite"
                >
                  {qualifying.pass.toLocaleString()} of{" "}
                  {qualifying.total.toLocaleString()} draws qualify
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Of all historical {game.name} draws, {qualifyingPct.toFixed(1)}%
                would pass the current constraint set. Lower numbers mean
                tighter controls — and a generator that has to work harder to
                find a valid combination.
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetOptions}
                disabled={isAtDefaults}
                aria-label="Reset controls to data-derived defaults"
                className="gap-1.5 text-muted-foreground"
              >
                <RotateCcwIcon className="size-3.5" aria-hidden />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAtDefaults
                ? "Already at data-derived defaults"
                : "Reset to data-derived defaults"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="max-iterations">
          <AccordionTrigger>
            <TriggerRow
              label="How long to keep trying"
              helper="Maximum iterations"
              value={genOptions.maxIterations.toLocaleString()}
              modified={isModified("maxIterations")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <MaxIterationsItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="score">
          <AccordionTrigger>
            <TriggerRow
              label="How closely numbers match historical positions"
              helper="Min positional frequency score"
              value={`${genOptions.minScore}%`}
              modified={isModified("minScore")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <PositionalFrequencyScoreItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="pair-score-weight">
          <AccordionTrigger>
            <TriggerRow
              label="How much to reward pairs that often draw together"
              helper="Pair-score weight"
              value={`${Math.round(genOptions.pairScoreWeight * 100)}%`}
              modified={isModified("pairScoreWeight")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <PairScoreWeightItem
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="triplet-score-weight">
          <AccordionTrigger>
            <TriggerRow
              label="How much to reward triplets that often draw together"
              helper="Triplet-score weight (soft tie-breaker)"
              value={`${Math.round(genOptions.tripletScoreWeight * 100)}%`}
              modified={isModified("tripletScoreWeight")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <TripletScoreWeightItem
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="recent-bias">
          <AccordionTrigger>
            <TriggerRow
              label="How much to favour recently-drawn numbers"
              helper="Recent-frequency bias"
              value={
                genOptions.recentBias > 0 && genOptions.recentWindowSize > 0
                  ? `${Math.round(genOptions.recentBias * 100)}% of last ${genOptions.recentWindowSize}`
                  : "off"
              }
              modified={isModified("recentBias", "recentWindowSize")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <RecentBiasItem
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="min-max-sum">
          <AccordionTrigger>
            <TriggerRow
              label="Total of the main numbers"
              helper="Sum range"
              value={`${genOptions.sumMin}–${genOptions.sumMax}`}
              modified={isModified("sumMin", "sumMax")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <MinMaxSumItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cluster-max">
          <AccordionTrigger>
            <TriggerRow
              label="How clumpy the numbers can be"
              helper="Cluster max (per group of 10)"
              value={String(genOptions.clusterMax)}
              modified={isModified("clusterMax")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <ClusterMaxItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="last-digit">
          <AccordionTrigger>
            <TriggerRow
              label="How many numbers can share a last digit"
              helper="Last-digit spread"
              value={String(genOptions.maxSameLastDigit)}
              modified={isModified("maxSameLastDigit")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <LastDigitItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="previous-draw-overlap">
          <AccordionTrigger>
            <TriggerRow
              label="How many numbers can repeat from the last draw"
              helper="Previous-draw overlap"
              value={String(genOptions.maxPreviousDrawOverlap)}
              modified={isModified("maxPreviousDrawOverlap")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <PreviousDrawOverlapItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="odd-even-dist">
          <AccordionTrigger>
            <TriggerRow
              label="Balance of odd and even numbers"
              helper="Odd/even split"
              value={`${genOptions.oddRange[0]}–${genOptions.oddRange[1]} odd`}
              modified={isModified("oddRange")}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <OddEvenDistItem
              analysis={analysis}
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="gap-dist">
          <AccordionTrigger>
            <TriggerRow
              label="How far apart the numbers can sit"
              helper="Gap distribution"
              value={
                showBonusGap
                  ? `main ≤ ${genOptions.maxMainGapThreshold}, ${bonusLabel} ≤ ${genOptions.maxLuckyGapThreshold}`
                  : `main ≤ ${genOptions.maxMainGapThreshold}`
              }
              modified={isModified(
                "maxMainGapThreshold",
                "maxLuckyGapThreshold",
              )}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <GapDistributionItem
              analysis={analysis}
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
