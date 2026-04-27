import { ThresholdCriteria } from "@/lib/generator";
import { FIELDS } from "@/constants";
import { PositionHeatmap } from "./position-heat-map";

interface Props {
  analysis: ThresholdCriteria | null;
}

interface FieldGroup {
  positions: number[];
  labels: string[];
  max: number;
}

function groupFieldsByMax(fields: typeof FIELDS): FieldGroup[] {
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
  const groups = groupFieldsByMax(FIELDS);

  return (
    <>
      <h2 className="text-lg font-medium">
        Distribution of Numbers by Draw Position
      </h2>
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
              usePct
            />
          </div>
        );
      })}
    </>
  );
};
