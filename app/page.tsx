"use client";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useData } from "@/context/useDataProvider";
import {
  generateValidNumberSet,
  GenerateValidNumberSetOptions,
  GenerateValidNumberSetResult,
} from "@/lib/generate-number-set";
import { DistributionAnalysis } from "@/lib/threshold-criteria";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PositionHeatmap } from "@/components/position-heat-map";

export default function Home() {
  const { pastNumbers, analysis, genOptions, updateOptions } = useData();

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateValidNumberSetResult | null>(
    null,
  );
  const startTimeRef = useRef<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/generateNumbers.worker.ts", import.meta.url),
      { type: "module" },
    );

    return () => workerRef.current?.terminate();
  }, []);

  const handleGenerate = async () => {
    if (!genOptions || !pastNumbers?.length)
      throw new Error("Error fetching data");
    if (!workerRef.current) throw new Error("Worker not ready");

    setIsGenerating(true);
    setDurationMs(null);

    startTimeRef.current = performance.now();

    workerRef.current.onmessage = (e) => {
      const msg = e.data as { ok: true; res: unknown };

      const end = performance.now();
      const start = startTimeRef.current ?? end;
      setDurationMs(end - start);

      setResults(msg.res as ReturnType<typeof generateValidNumberSet>);
      setIsGenerating(false);
    };

    workerRef.current.onerror = (err) => {
      console.error(err);

      const end = performance.now();
      const start = startTimeRef.current ?? end;
      setDurationMs(end - start);

      setIsGenerating(false);
      alert("Generation failed");
    };

    workerRef.current.postMessage({ pastNumbers, genOptions });
  };

  const handleOddRangeChange = (r: DistributionAnalysis) => {
    if (!analysis) return;
    if (
      r.oddCount === genOptions.oddRange[0] ||
      r.oddCount === genOptions.oddRange[1]
    )
      return;

    const index = analysis.distribution.findIndex(
      (row) => row.label === r.label,
    );
    const middleIndex = analysis.distribution.length / 2;

    let prevRange = genOptions.oddRange;
    if (index < middleIndex) {
      prevRange[0] = r.oddCount;
    } else {
      prevRange[1] = r.oddCount;
    }

    updateOptions("oddRange", prevRange);
  };

  const handleGapChange = (
    key: "maxMainGapThreshold" | "maxLuckyGapThreshold",
    gap: number,
  ) => {
    if (!analysis) return;
    if (gap === genOptions.maxMainGapThreshold) return;
    updateOptions(key, gap);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!analysis) return;
    const name = e.target.name as keyof GenerateValidNumberSetOptions;
    const value = e.target.value;
    updateOptions(name, Number(value));
  };

  const counters = analysis?.gapDistributionData.main.gapCounters ?? [];

  // Collect all gap keys that exist across all counters
  const allGaps = Array.from(
    new Set(counters.flatMap((obj) => Object.keys(obj))),
  )
    .map(Number)
    .sort((a, b) => a - b);

  const cells = analysis?.toHeatmapCells(1, 50) ?? [];
  const positionCounters = analysis?.positionCounters ?? [];

  console.log(results?.bestPatternProb);

  return (
    <div className="flex flex-col gap-y-4 w-full justify-center">
      <h1 className="text-2xl font-bold">Generate Numbers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-semibold">Generate</h3>
            {isGenerating && <Spinner className="size-6" />}
          </div>
          <Button
            onClick={handleGenerate}
            className="px-2 py-1 border rounded-md cursor-pointer"
          >
            Generate
          </Button>
          {results && (
            <>
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Completed in:</Label>
                <Label>
                  {durationMs ? (durationMs / 1000).toFixed(2) : 0}s
                </Label>
                <Label>Iterations:</Label>
                <Label>{results?.iterations}</Label>
                <Label>Positional Frequency Score:</Label>
                <Label>{results?.bestScore.toFixed(2)}%</Label>
              </div>
              <div className="flex gap-x-2 lg:gap-x-4 items-center justify-between w-full">
                <Card className="p-2 py-4 lg:p-4 w-full">
                  <ul className="flex gap-x-2 items-center w-fit mx-auto">
                    {results?.bestCombination?.map((n, index) => (
                      <li
                        key={index}
                        title={`Pattern Probability Score: ${results.bestPatternProb ? results.bestPatternProb[index].toFixed(2) : 0}%`}
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                </Card>
                <CopyToClipboardButton
                  txtToCopy={
                    results?.bestCombination
                      ? results.bestCombination.join(", ")
                      : undefined
                  }
                />
              </div>
              <Label className="text-sm font-extralight">
                Hover over numbers to check individual positional frequency
                scores
              </Label>
            </>
          )}
        </Card>
        <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full">
          <h3 className="text-lg font-semibold">Controls</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="max-iterations">
              <AccordionTrigger>Maximum Iterations</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  Controls how many attempts the generator can make before
                  stopping. Higher values allow more time to satisfy strict
                  constraints but may increase processing time.
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center">
                  <Label>Max Iterations</Label>
                  <Input
                    name="maxIterations"
                    type="number"
                    min={0}
                    value={genOptions.maxIterations}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="score">
              <AccordionTrigger>
                Minimum Positional Frequency Score
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  Controls how closely generated numbers must match common
                  historical position patterns shown in the heatmap below. The
                  score represents an average across the entire generated number
                  set. Increasing this value makes generation more restrictive
                  and may increase processing time or prevent valid results from
                  being found.
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center">
                  <Label>Min Score</Label>
                  <Input
                    name="minScore"
                    type="number"
                    min={0}
                    value={genOptions.minScore}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="min-max-sum">
              <AccordionTrigger>Min/Max Sum</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  This shows the min/max sum of all main numbers in historical
                  draws between the 15th and 85th percentile. Adjust these
                  numbers for generation.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
                  <Label>Min Sum</Label>
                  <Input
                    name="sumMin"
                    type="number"
                    min={0}
                    value={genOptions.sumMin}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.select()}
                  />
                  <Label>Max Sum</Label>
                  <Input
                    name="sumMax"
                    type="number"
                    min={0}
                    value={genOptions.sumMax}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cluster-max">
              <AccordionTrigger>Cluster Max</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  Clusters of numbers can occur within each group of 10. Adjust
                  to modify the generation parameters.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
                  <Label>Max Numbers in Cluster</Label>
                  <Input
                    name="clusterMax"
                    type="number"
                    min={0}
                    max={5}
                    value={genOptions.clusterMax}
                    onChange={handleInputChange}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="odd-even-dist">
              <AccordionTrigger>Odd/Even Distribution</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  This table breaks down historical draws by how many odd versus
                  even numbers they contain. Click a row to adjust the min/max
                  range used in generation.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Label</TableHead>
                      <TableHead className="font-medium text-center">
                        Count
                      </TableHead>
                      <TableHead className="font-medium text-center">
                        Percentage
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis?.distribution.map((r, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          "cursor-pointer hover:bg-slate-300",
                          r.oddCount === genOptions.oddRange[0] &&
                            "bg-slate-300",
                          r.oddCount === genOptions.oddRange[1] &&
                            "bg-slate-300",
                        )}
                        onClick={() => handleOddRangeChange(r)}
                      >
                        <TableCell>{r.label}</TableCell>
                        <TableCell className="text-center">{r.count}</TableCell>
                        <TableCell className="text-center">
                          {r.pct.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="gap-dist">
              <AccordionTrigger>Gap Distribution</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <p>
                  Gap distributions measure the distance between consecutive
                  numbers in a draw. Smaller gaps indicate clustered numbers,
                  while larger gaps indicate more spread-out selections.
                </p>
                <Accordion type="single" collapsible>
                  <AccordionItem value="main-gap-dist">
                    <AccordionTrigger>Main Numbers</AccordionTrigger>
                    <AccordionContent>
                      <p>
                        Each column represents the gap between two adjacent main
                        numbers after sorting. Rows show how frequently a given
                        gap size appears across historical draws. Selecting row
                        to adjust the max gap size used in generation.
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Gap</TableHead>
                            {analysis?.gapDistributionData.main.gapCounters.map(
                              (_, index) => (
                                <TableHead key={index} className="font-medium">
                                  N{index + 1} to N{index + 2}
                                </TableHead>
                              ),
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allGaps.map((gap) => (
                            <TableRow
                              key={gap}
                              className={cn(
                                "cursor-pointer hover:bg-slate-200",
                                gap === genOptions.maxMainGapThreshold &&
                                  "bg-slate-300",
                              )}
                              onClick={() =>
                                handleGapChange("maxMainGapThreshold", gap)
                              }
                            >
                              <TableCell className="font-medium text-center">
                                {gap}
                              </TableCell>

                              {counters.map((counterObj, idx) => (
                                <TableCell
                                  key={idx}
                                  className={cn("text-center")}
                                >
                                  {counterObj[gap] ?? 0}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="lucky-gap-dist">
                    <AccordionTrigger>Lucky Numbers</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-y-2">
                      <p>
                        Each column represents the gap between two adjacent
                        lucky numbers after sorting. Rows show how frequently a
                        given gap size appears across historical draws.
                        Selecting row to adjust the max gap size used in
                        generation.
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Gap</TableHead>
                            <TableHead className="text-center">
                              N1 to N2
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(
                            analysis?.gapDistributionData.lucky
                              .gapCounters[0] ?? {},
                          ).map(([gap, count]) => (
                            <TableRow
                              key={gap}
                              className={cn(
                                "cursor-pointer hover:bg-slate-200",
                                Number(gap) ===
                                  genOptions.maxLuckyGapThreshold &&
                                  "bg-slate-300",
                              )}
                              onClick={() =>
                                handleGapChange(
                                  "maxLuckyGapThreshold",
                                  Number(gap),
                                )
                              }
                            >
                              <TableCell className="font-medium text-center">
                                {gap}
                              </TableCell>
                              <TableCell className="text-center">
                                {count ?? 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
      <div className="flex flex-col gap-y-4">
        <h2 className="text-lg font-medium">
          Distribution of Numbers by Draw Position
        </h2>
        <PositionHeatmap
          cells={cells}
          numPositions={positionCounters.length}
          minNum={1}
          maxNum={50}
          usePct
        />
      </div>
    </div>
  );
}
