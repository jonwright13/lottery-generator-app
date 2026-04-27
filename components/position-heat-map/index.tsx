"use client";

import { useState } from "react";
import { ThresholdCriteria } from "@/lib/generator";
import type { FieldDef } from "@/constants";
import { useData } from "@/context/useDataProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HelpPopover } from "@/components/ui/help-popover";
import { cn } from "@/lib/utils";
import { PositionHeatmap } from "./position-heat-map";

interface Props {
  analysis: ThresholdCriteria | null;
}

interface FieldGroup {
  positions: number[];
  labels: string[];
  max: number;
}

function groupFieldsByMax(fields: FieldDef[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  fields.forEach((f, idx) => {
    const last = groups[groups.length - 1];
    if (last && last.max === f.max) {
      last.positions.push(idx);
      last.labels.push(f.label);
    } else {
      groups.push({ positions: [idx], labels: [f.label], max: f.max });
    }
  });
  return groups;
}

export const Heatmap = ({ analysis }: Props) => {
  const { game, fields } = useData();
  const groups = groupFieldsByMax(fields);
  const [usePct, setUsePct] = useState(true);

  return (
    <Card className="flex flex-col gap-y-3 p-4 w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-y-1">
          <h2 className="text-lg font-medium">
            Distribution of Numbers by Draw Position
          </h2>
          <p className="text-xs text-muted-foreground">
            Each row is a draw position (numbers are sorted before display).
            Darker cells appear more often.
          </p>
        </div>
        <div className="flex items-center gap-x-2">
          <div
            role="group"
            aria-label="Display values as"
            className="inline-flex rounded-md border p-0.5"
          >
            <Button
              type="button"
              size="sm"
              variant={usePct ? "default" : "ghost"}
              aria-pressed={usePct}
              onClick={() => setUsePct(true)}
              className={cn("h-7 px-3 text-xs")}
            >
              Percentage
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!usePct ? "default" : "ghost"}
              aria-pressed={!usePct}
              onClick={() => setUsePct(false)}
              className={cn("h-7 px-3 text-xs")}
            >
              Count
            </Button>
          </div>
          <HelpPopover title="Distribution of numbers by draw position">
            <p>
              Before display, every historical draw has its {game.main.count}{" "}
              main numbers sorted smallest to largest, plus its{" "}
              {game.bonus.count} {game.bonus.label.toLowerCase()} number
              {game.bonus.count === 1 ? "" : "s"}. Each row of the grid is one
              of those slots. Darker cells mean that number landed in that slot
              more often.
            </p>
            <p>
              <strong>Why it matters:</strong> the lowest of the five mains is
              almost always a small number, and the largest is almost always a
              high one. The generator uses this distribution to score
              candidates — sets that match the historical per-position pattern
              are preferred over sets that don&apos;t.
            </p>
          </HelpPopover>
        </div>
      </div>

      {groups.map((group) => {
        const allCells = analysis?.toHeatmapCells(1, group.max) ?? [];
        const positionSet = new Set(group.positions);
        const cells = allCells.filter((c) => positionSet.has(c.pos));

        return (
          <div
            key={group.positions.join("-")}
            className="flex flex-col gap-y-2"
          >
            <h3 className="text-sm font-medium text-muted-foreground">
              {group.labels.join(", ")} (1–{group.max})
            </h3>
            <PositionHeatmap
              cells={cells}
              positions={group.positions}
              positionLabels={group.labels}
              minNum={1}
              maxNum={group.max}
              usePct={usePct}
            />
          </div>
        );
      })}

      <HeatmapLegend usePct={usePct} />
    </Card>
  );
};

const HeatmapLegend = ({ usePct }: { usePct: boolean }) => (
  <div className="flex items-center gap-x-2 text-xs text-muted-foreground">
    <span>{usePct ? "Lower %" : "Fewer"}</span>
    <div
      aria-hidden="true"
      className="h-3 w-32 rounded-sm border"
      style={{
        background:
          "linear-gradient(to right, rgba(2,132,199,0.08), rgba(2,132,199,0.93))",
      }}
    />
    <span>{usePct ? "Higher %" : "More"}</span>
  </div>
);
