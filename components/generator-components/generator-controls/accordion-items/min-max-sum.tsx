import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const MinMaxSumItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        This shows the min/max sum of all main numbers in historical draws
        between the 15th and 85th percentile. Adjust these numbers for
        generation.
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
    </>
  );
};
