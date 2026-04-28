"use client";

import { ArithmeticProgressionDistribution } from "@/components/analysis-components/arithmetic-progression-distribution";
import { ClusterDistribution } from "@/components/analysis-components/cluster-distribution";
import { ConsecutiveRunDistribution } from "@/components/analysis-components/consecutive-run-distribution";
import { GapDistribution } from "@/components/analysis-components/gap-distribution";
import { HotColdNumbers } from "@/components/analysis-components/hot-cold-numbers";
import { LastDigitDistribution } from "@/components/analysis-components/last-digit-distribution";
import { MaxPatternProbabilities } from "@/components/analysis-components/max-pattern-probabilities";
import { MultiplesDistribution } from "@/components/analysis-components/multiples-distribution";
import { NumberFrequency } from "@/components/analysis-components/number-frequency";
import { OddEvenDistribution } from "@/components/analysis-components/odd-even-distribution";
import { PairCoOccurrence } from "@/components/analysis-components/pair-cooccurrence";
import { PreviousDrawOverlap } from "@/components/analysis-components/previous-draw-overlap";
import { SumDistribution } from "@/components/analysis-components/sum-distribution";
import { TopNumbersPerPosition } from "@/components/analysis-components/top-numbers-per-position";
import { TripletCoOccurrence } from "@/components/analysis-components/triplet-cooccurrence";
import {
  WindowFilter,
  isWindowKey,
  resolveWindowBounds,
  seedCustomRange,
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isISODate = (v: string | null): v is string =>
  v !== null && ISO_DATE_RE.test(v);

export default function AnalysisPage() {
  return (
    <Suspense fallback={null}>
      <AnalysisContent />
    </Suspense>
  );
}

const AnalysisContent = () => {
  const {
    game,
    pastNumbers,
    dates,
    analysis: fullAnalysis,
    updatedAt,
  } = useData();

  const searchParams = useSearchParams();
  const router = useRouter();

  const rawWindow = searchParams.get("window");
  const windowKey: WindowKey = isWindowKey(rawWindow) ? rawWindow : "all";

  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");
  const customFrom = isISODate(rawFrom) ? rawFrom : null;
  const customTo = isISODate(rawTo) ? rawTo : null;

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/analysis?${qs}` : "/analysis", { scroll: false });
    },
    [router, searchParams],
  );

  const setWindow = useCallback(
    (key: WindowKey) => {
      updateParams((params) => {
        if (key === "all") params.delete("window");
        else params.set("window", key);
        if (key !== "custom") {
          params.delete("from");
          params.delete("to");
        } else if (!isISODate(params.get("from")) || !isISODate(params.get("to"))) {
          const seed = seedCustomRange();
          if (!isISODate(params.get("from"))) params.set("from", seed.from);
          if (!isISODate(params.get("to"))) params.set("to", seed.to);
        }
      });
    },
    [updateParams],
  );

  const setCustomFrom = useCallback(
    (value: string) => {
      updateParams((params) => {
        if (isISODate(value)) params.set("from", value);
        else params.delete("from");
      });
    },
    [updateParams],
  );

  const setCustomTo = useCallback(
    (value: string) => {
      updateParams((params) => {
        if (isISODate(value)) params.set("to", value);
        else params.delete("to");
      });
    },
    [updateParams],
  );

  const { windowedPast, windowedDates, windowedAnalysis } = useMemo(() => {
    const { from, to } = resolveWindowBounds(windowKey, customFrom, customTo);
    if (!from && !to) {
      return {
        windowedPast: pastNumbers,
        windowedDates: dates,
        windowedAnalysis: fullAnalysis,
      };
    }
    const idx: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (from && d < from) continue;
      if (to && d > to) continue;
      idx.push(i);
    }
    const wp = idx.map((i) => pastNumbers[i]);
    const wd = idx.map((i) => dates[i]);
    const wa =
      wp.length > 0 ? new ThresholdCriteria(wp, game, false) : fullAnalysis;
    return {
      windowedPast: wp,
      windowedDates: wd,
      windowedAnalysis: wa,
    };
  }, [
    pastNumbers,
    dates,
    fullAnalysis,
    windowKey,
    customFrom,
    customTo,
    game,
  ]);

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
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {!hasData ? (
        <p className="text-sm text-muted-foreground">
          The selected window contains no draws.
        </p>
      ) : (
        <>
          <Heatmap
            analysis={windowedAnalysis}
            pastNumbers={windowedPast}
            dates={windowedDates}
          />

          <NumberFrequency analysis={windowedAnalysis} />

          <TopNumbersPerPosition analysis={windowedAnalysis} />

          <MaxPatternProbabilities analysis={windowedAnalysis} />

          <SumDistribution
            pastNumbers={windowedPast}
            analysis={windowedAnalysis}
          />

          <OddEvenDistribution analysis={windowedAnalysis} />

          <GapDistribution analysis={windowedAnalysis} />

          <ClusterDistribution pastNumbers={windowedPast} />

          <LastDigitDistribution analysis={windowedAnalysis} />

          <MultiplesDistribution analysis={windowedAnalysis} />

          <PreviousDrawOverlap analysis={windowedAnalysis} />

          <ArithmeticProgressionDistribution analysis={windowedAnalysis} />

          <ConsecutiveRunDistribution analysis={windowedAnalysis} />

          <PairCoOccurrence analysis={windowedAnalysis} />

          <TripletCoOccurrence analysis={windowedAnalysis} />

          <HotColdNumbers pastNumbers={windowedPast} />
        </>
      )}
    </div>
  );
};
