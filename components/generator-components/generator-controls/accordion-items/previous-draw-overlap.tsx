import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const PreviousDrawOverlapItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        Reject sets that share more than this many main numbers with the
        immediately prior draw. Default seeded from history.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label>Max Overlap with Previous Draw</Label>
        <Input
          name="maxPreviousDrawOverlap"
          type="number"
          min={0}
          max={5}
          value={genOptions.maxPreviousDrawOverlap}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
};
