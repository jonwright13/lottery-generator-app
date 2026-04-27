import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const LastDigitItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        Reject sets where more than this many main numbers share the same last
        digit (e.g. 7, 17, 27). Default seeded from history.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label>Max Same Last Digit</Label>
        <Input
          name="maxSameLastDigit"
          type="number"
          min={1}
          max={5}
          value={genOptions.maxSameLastDigit}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
};
