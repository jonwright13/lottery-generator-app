"use client";

import { GeneratorContainer } from "@/components/generator-components/generator-container";
import { GeneratorControls } from "@/components/generator-components/generator-controls";
import { useData } from "@/context/useDataProvider";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export default function Home() {
  const { pastNumbers, analysis, genOptions, updateOptions, updatedAt } =
    useData();

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 items-start">
        <GeneratorContainer
          pastNumbers={pastNumbers}
          genOptions={genOptions}
          positionCounters={analysis.positionCounters}
        />
        <GeneratorControls
          updateOptions={updateOptions}
          analysis={analysis}
          genOptions={genOptions}
        />
      </div>
    </div>
  );
}
