"use client";

import { GeneratedStats } from "@/components/generator-components/generated-stats";
import { GeneratorContainer } from "@/components/generator-components/generator-container";
import { GeneratorControls } from "@/components/generator-components/generator-controls";
import { MatchResults } from "@/components/match-results";
import { useData } from "@/context/useDataProvider";
import { useGenerator } from "@/hooks/use-generator";

const MAIN_COUNT = 5;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export default function Home() {
  const { pastNumbers, analysis, genOptions, updateOptions, updatedAt } =
    useData();

  const { isGenerating, results, durationMs, generate } = useGenerator();

  const handleGenerate = () =>
    generate(pastNumbers, genOptions, analysis.positionCounters);

  const combination = results?.bestCombination ?? null;
  const userMain = combination ? combination.slice(0, MAIN_COUNT) : null;
  const userLucky = combination ? combination.slice(MAIN_COUNT) : null;

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <GeneratorContainer
          isGenerating={isGenerating}
          results={results}
          durationMs={durationMs}
          onGenerate={handleGenerate}
        />
        <GeneratorControls
          updateOptions={updateOptions}
          analysis={analysis}
          genOptions={genOptions}
        />
        {combination && (
          <>
            <MatchResults userMain={userMain} userLucky={userLucky} />
            <GeneratedStats
              combination={combination}
              bestPatternProb={results?.bestPatternProb ?? null}
              genOptions={genOptions}
              previousDraw={pastNumbers[0] ?? null}
            />
          </>
        )}
      </div>
    </div>
  );
}
