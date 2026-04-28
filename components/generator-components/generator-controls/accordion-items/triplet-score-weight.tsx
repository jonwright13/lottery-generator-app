import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateOptions } from "@/lib/generator";
import { TableItemProps } from "../types";

type Props = Pick<TableItemProps, "genOptions"> & {
  updateOptions: UpdateOptions;
};

export const TripletScoreWeightItem = ({
  genOptions,
  updateOptions,
}: Props) => {
  const percent = Math.round(genOptions.tripletScoreWeight * 100);

  const handleChange = (raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(100, Math.max(0, value));
    updateOptions("tripletScoreWeight", clamped / 100);
  };

  return (
    <>
      <p>
        Blend triplet-cohesion (how often the chosen 3-number combinations of
        main numbers have all co-occurred historically) into the score the
        generator optimises. Layered on top of pair weighting — 0 leaves
        behaviour unchanged.
      </p>
      <p className="text-xs text-muted-foreground">
        Note: with ~3,000 historical draws and tens of thousands of possible
        triplets, most triplets have only a few hits. Treat this as a soft
        tie-breaker rather than a strong signal.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label htmlFor="tripletScoreWeight">Triplet-Score Weight (%)</Label>
        <Input
          id="tripletScoreWeight"
          name="tripletScoreWeight"
          type="number"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </>
  );
};
