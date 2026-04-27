"use client";

import { GapDistribution } from "@/components/analysis-components/gap-distribution";
import { NumberFrequency } from "@/components/analysis-components/number-frequency";
import { OddEvenDistribution } from "@/components/analysis-components/odd-even-distribution";
import { SumDistribution } from "@/components/analysis-components/sum-distribution";
import { TopNumbersPerPosition } from "@/components/analysis-components/top-numbers-per-position";
import { Heatmap } from "@/components/position-heat-map";
import { useData } from "@/context/useDataProvider";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export default function AnalysisPage() {
  const { pastNumbers, analysis, updatedAt } = useData();

  const updatedLabel = (() => {
    const d = new Date(updatedAt);
    return Number.isNaN(d.getTime()) ? null : dateFormatter.format(d);
  })();

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 w-full">
        <div className="flex flex-col gap-y-1">
          <h1 className="text-2xl font-bold">Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Patterns across {pastNumbers.length.toLocaleString()} historical
            draws.
          </p>
        </div>
        {updatedLabel && (
          <p className="text-xs text-muted-foreground">
            Historical data updated{" "}
            <time dateTime={updatedAt}>{updatedLabel}</time>
          </p>
        )}
      </div>

      <Heatmap analysis={analysis} />

      <NumberFrequency analysis={analysis} />

      <TopNumbersPerPosition analysis={analysis} />

      <SumDistribution pastNumbers={pastNumbers} analysis={analysis} />

      <OddEvenDistribution analysis={analysis} />

      <GapDistribution analysis={analysis} />
    </div>
  );
}
