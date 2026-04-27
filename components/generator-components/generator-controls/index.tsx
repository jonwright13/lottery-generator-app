"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  ThresholdCriteria,
  type GenerateValidNumberSetOptions,
  type UpdateOptions,
} from "@/lib/generator";
import { GeneratorProps } from "../types";
import {
  ClusterMaxItem,
  GapDistributionItem,
  LastDigitItem,
  MaxIterationsItem,
  MinMaxSumItem,
  OddEvenDistItem,
  PositionalFrequencyScoreItem,
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

const TriggerRow = ({ label, value }: { label: string; value: string }) => (
  <span className="flex w-full items-center justify-between gap-3 pr-2">
    <span>{label}</span>
    <span className="text-muted-foreground tabular-nums font-normal text-xs">
      {value}
    </span>
  </span>
);

export const GeneratorControls = ({
  analysis,
  genOptions,
  updateOptions,
}: Props) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!analysis) return;
    // Inputs in this surface only drive numeric option keys.
    const name = e.target.name as NumericOptionKey;
    updateOptions(name, Number(e.target.value));
  };

  return (
    <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full h-full">
      <h3 className="text-lg font-semibold">Controls</h3>
      <Accordion type="single" collapsible>
        <AccordionItem value="max-iterations">
          <AccordionTrigger>
            <TriggerRow
              label="Maximum Iterations"
              value={genOptions.maxIterations.toLocaleString()}
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
              label="Minimum Positional Frequency Score"
              value={`${genOptions.minScore}%`}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <PositionalFrequencyScoreItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="min-max-sum">
          <AccordionTrigger>
            <TriggerRow
              label="Min/Max Sum"
              value={`${genOptions.sumMin}–${genOptions.sumMax}`}
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
              label="Cluster Max"
              value={String(genOptions.clusterMax)}
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
              label="Max Same Last Digit"
              value={String(genOptions.maxSameLastDigit)}
            />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <LastDigitItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="odd-even-dist">
          <AccordionTrigger>
            <TriggerRow
              label="Odd/Even Distribution"
              value={`${genOptions.oddRange[0]}–${genOptions.oddRange[1]} odd`}
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
              label="Gap Distribution"
              value={`main ≤ ${genOptions.maxMainGapThreshold}, lucky ≤ ${genOptions.maxLuckyGapThreshold}`}
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
