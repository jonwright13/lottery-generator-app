import { ThresholdCriteria } from "@/lib/generator";
import { PositionHeatmap } from "./position-heat-map";

interface Props {
  analysis: ThresholdCriteria | null;
}

export const Heatmap = ({ analysis }: Props) => {
  const cells = analysis?.toHeatmapCells(1, 50) ?? [];
  const positionCounters = analysis?.positionCounters ?? [];

  return (
    <>
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
    </>
  );
};
