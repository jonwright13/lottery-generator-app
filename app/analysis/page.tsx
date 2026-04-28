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
import {
  SectionToc,
  type SectionItem,
} from "@/components/analysis-components/section-toc";
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
import { BackToTop } from "@/components/back-to-top";
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

const SECTIONS: ReadonlyArray<SectionItem> = [
  { id: "heatmap", label: "Position heatmap" },
  { id: "frequency", label: "Number frequency" },
  { id: "top-numbers", label: "Top numbers per position" },
  { id: "max-pattern", label: "Max pattern probabilities" },
  { id: "sum", label: "Sum of main numbers" },
  { id: "odd-even", label: "Odd / even split" },
  { id: "gap", label: "Gap distribution" },
  { id: "decade", label: "Decade bands" },
  { id: "last-digit", label: "Last-digit distribution" },
  { id: "multiples", label: "Multiples-of-N caps" },
  { id: "previous-draw", label: "Previous-draw overlap" },
  { id: "ap", label: "Arithmetic progression" },
  { id: "consecutive-run", label: "Consecutive runs" },
  { id: "pair", label: "Pair co-occurrence" },
  { id: "triplet", label: "Triplet co-occurrence" },
  { id: "hot-cold", label: "Hot & cold numbers" },
];

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
          <SectionToc sections={SECTIONS} />

          <section id="heatmap" className="scroll-mt-6 w-full">
            <Heatmap
              analysis={windowedAnalysis}
              pastNumbers={windowedPast}
              dates={windowedDates}
            />
          </section>

          <section id="frequency" className="scroll-mt-6 w-full">
            <NumberFrequency analysis={windowedAnalysis} />
          </section>

          <section id="top-numbers" className="scroll-mt-6 w-full">
            <TopNumbersPerPosition analysis={windowedAnalysis} />
          </section>

          <section id="max-pattern" className="scroll-mt-6 w-full">
            <MaxPatternProbabilities analysis={windowedAnalysis} />
          </section>

          <section id="sum" className="scroll-mt-6 w-full">
            <SumDistribution
              pastNumbers={windowedPast}
              analysis={windowedAnalysis}
            />
          </section>

          <section id="odd-even" className="scroll-mt-6 w-full">
            <OddEvenDistribution analysis={windowedAnalysis} />
          </section>

          <section id="gap" className="scroll-mt-6 w-full">
            <GapDistribution analysis={windowedAnalysis} />
          </section>

          <section id="decade" className="scroll-mt-6 w-full">
            <ClusterDistribution pastNumbers={windowedPast} />
          </section>

          <section id="last-digit" className="scroll-mt-6 w-full">
            <LastDigitDistribution analysis={windowedAnalysis} />
          </section>

          <section id="multiples" className="scroll-mt-6 w-full">
            <MultiplesDistribution analysis={windowedAnalysis} />
          </section>

          <section id="previous-draw" className="scroll-mt-6 w-full">
            <PreviousDrawOverlap analysis={windowedAnalysis} />
          </section>

          <section id="ap" className="scroll-mt-6 w-full">
            <ArithmeticProgressionDistribution analysis={windowedAnalysis} />
          </section>

          <section id="consecutive-run" className="scroll-mt-6 w-full">
            <ConsecutiveRunDistribution analysis={windowedAnalysis} />
          </section>

          <section id="pair" className="scroll-mt-6 w-full">
            <PairCoOccurrence analysis={windowedAnalysis} />
          </section>

          <section id="triplet" className="scroll-mt-6 w-full">
            <TripletCoOccurrence analysis={windowedAnalysis} />
          </section>

          <section id="hot-cold" className="scroll-mt-6 w-full">
            <HotColdNumbers pastNumbers={windowedPast} />
          </section>
        </>
      )}

      <BackToTop />
    </div>
  );
};
