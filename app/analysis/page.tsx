"use client";

import { ClusterDistribution } from "@/components/analysis-components/cluster-distribution";
import { GapDistribution } from "@/components/analysis-components/gap-distribution";
import { LastDigitDistribution } from "@/components/analysis-components/last-digit-distribution";
import { NumberFrequency } from "@/components/analysis-components/number-frequency";
import { OddEvenDistribution } from "@/components/analysis-components/odd-even-distribution";
import { SumDistribution } from "@/components/analysis-components/sum-distribution";
import { TopNumbersPerPosition } from "@/components/analysis-components/top-numbers-per-position";
import {
  WINDOW_OPTIONS,
  WindowFilter,
  isWindowKey,
  type WindowKey,
} from "@/components/analysis-components/window-filter";
import { Heatmap } from "@/components/position-heat-map";
import { useData } from "@/context/useDataProvider";
import { ThresholdCriteria } from "@/lib/generator";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const computeCutoff = (years: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

export default function AnalysisPage() {
  return (
    <Suspense fallback={null}>
      <AnalysisContent />
    </Suspense>
  );
}

const AnalysisContent = () => {
  const {
    pastNumbers,
    dates,
    analysis: fullAnalysis,
    updatedAt,
  } = useData();

  const searchParams = useSearchParams();
  const router = useRouter();

  const rawWindow = searchParams.get("window");
  const windowKey: WindowKey = isWindowKey(rawWindow) ? rawWindow : "all";

  const setWindow = useCallback(
    (key: WindowKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "all") params.delete("window");
      else params.set("window", key);
      const qs = params.toString();
      router.replace(qs ? `/analysis?${qs}` : "/analysis", { scroll: false });
    },
    [router, searchParams],
  );

  const { windowedPast, windowedDates, windowedAnalysis } = useMemo(() => {
    const opt = WINDOW_OPTIONS.find((o) => o.key === windowKey);
    if (!opt || opt.years == null) {
      return {
        windowedPast: pastNumbers,
        windowedDates: dates,
        windowedAnalysis: fullAnalysis,
      };
    }
    const cutoff = computeCutoff(opt.years);
    const idx: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] >= cutoff) idx.push(i);
    }
    const wp = idx.map((i) => pastNumbers[i]);
    const wd = idx.map((i) => dates[i]);
    const wa = wp.length > 0 ? new ThresholdCriteria(wp, false) : fullAnalysis;
    return {
      windowedPast: wp,
      windowedDates: wd,
      windowedAnalysis: wa,
    };
  }, [pastNumbers, dates, fullAnalysis, windowKey]);

  const updatedLabel = (() => {
    const d = new Date(updatedAt);
    return Number.isNaN(d.getTime()) ? null : dateFormatter.format(d);
  })();

  const hasData = windowedPast.length > 0;

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 w-full">
        <div className="flex flex-col gap-y-1">
          <h1 className="text-2xl font-bold">Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Patterns across {windowedPast.length.toLocaleString()} historical
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

      <WindowFilter
        value={windowKey}
        onChange={setWindow}
        totalDraws={pastNumbers.length}
        windowedDraws={windowedPast.length}
        windowStart={windowedDates[windowedDates.length - 1] ?? null}
        windowEnd={windowedDates[0] ?? null}
      />

      {!hasData ? (
        <p className="text-sm text-muted-foreground">
          The selected window contains no draws.
        </p>
      ) : (
        <>
          <Heatmap analysis={windowedAnalysis} />

          <NumberFrequency analysis={windowedAnalysis} />

          <TopNumbersPerPosition analysis={windowedAnalysis} />

          <SumDistribution
            pastNumbers={windowedPast}
            analysis={windowedAnalysis}
          />

          <OddEvenDistribution analysis={windowedAnalysis} />

          <GapDistribution analysis={windowedAnalysis} />

          <ClusterDistribution pastNumbers={windowedPast} />

          <LastDigitDistribution analysis={windowedAnalysis} />
        </>
      )}
    </div>
  );
};
