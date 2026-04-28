"use client";

import { GeneratedStats } from "@/components/generator-components/generated-stats";
import { GeneratorContainer } from "@/components/generator-components/generator-container";
import { GeneratorControls } from "@/components/generator-components/generator-controls";
import { MatchResults } from "@/components/match-results";
import { useData } from "@/context/useDataProvider";
import { useGenerator } from "@/hooks/use-generator";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export default function Home() {
  const { game, pastNumbers, analysis, genOptions, updateOptions, updatedAt } =
    useData();

  const { isGenerating, results, durationMs, generate } = useGenerator();

  const handleGenerate = () =>
    generate(
      pastNumbers,
      genOptions,
      analysis.positionCounters,
      analysis.pairCoOccurrenceData.pairCounts,
    );

  const combination = results?.bestCombination ?? null;
  const userMain = combination ? combination.slice(0, game.main.count) : null;
  const userLucky = combination ? combination.slice(game.main.count) : null;

  const updatedLabel = (() => {
    const d = new Date(updatedAt);
    return Number.isNaN(d.getTime()) ? null : dateFormatter.format(d);
  })();

  return (
    <div className="flex flex-col gap-y-4 w-full justify-center">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 w-full">
        <h1 className="text-2xl font-bold">Generate Numbers</h1>
        {updatedLabel && (
          <p className="text-xs text-muted-foreground">
            Historical data updated{" "}
            <time dateTime={updatedAt}>{updatedLabel}</time>
          </p>
        )}
      </div>
      {/* Card order: source order is the desktop reading order (Generator,
          Controls, MatchResults, Stats — i.e. 2x2 with the primary loop on
          the left and reference cards on the right). On mobile (single
          column) we use `order-N` to bubble MatchResults right under the
          Generator so the user can see "is this any good?" without scrolling
          past the Controls card every regenerate. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <div className="order-1">
          <GeneratorContainer
            isGenerating={isGenerating}
            results={results}
            durationMs={durationMs}
            onGenerate={handleGenerate}
          />
        </div>
        <div className="order-4 md:order-2">
          <GeneratorControls
            updateOptions={updateOptions}
            analysis={analysis}
            genOptions={genOptions}
          />
        </div>
        {combination && (
          <>
            <div className="order-2 md:order-3">
              <MatchResults userMain={userMain} userLucky={userLucky} />
            </div>
            <div className="order-3 md:order-4">
              <GeneratedStats
                combination={combination}
                bestPatternProb={results?.bestPatternProb ?? null}
                genOptions={genOptions}
                previousDraw={pastNumbers[0] ?? null}
                pairData={analysis.pairCoOccurrenceData}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
