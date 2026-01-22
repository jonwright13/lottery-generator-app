import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const PositionalFrequencyScoreItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        Controls how closely generated numbers must match common historical
        position patterns shown in the heatmap below. The score represents an
        average across the entire generated number set. Increasing this value
        makes generation more restrictive and may increase processing time or
        prevent valid results from being found.
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
    </>
  );
};
