import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableItemProps } from "../types";

export const OddEvenDistItem = ({
  analysis,
  genOptions,
  updateOptions,
}: TableItemProps) => {
  const distribution = analysis?.distribution ?? [];
  const maxOdd = distribution.length > 0 ? distribution.length - 1 : 5;
  const [minOdd, maxOddRange] = genOptions.oddRange;

  const handleBoundChange = (
    bound: "min" | "max",
    raw: string,
  ) => {
    if (!analysis) return;
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    const clamped = Math.max(0, Math.min(maxOdd, value));
    const next: [number, number] =
      bound === "min"
        ? [Math.min(clamped, maxOddRange), maxOddRange]
        : [minOdd, Math.max(clamped, minOdd)];
    updateOptions("oddRange", next);
  };

  return (
    <>
      <p>
        Set the allowed range of odd numbers per generated set. Rows in the
        selected range are highlighted.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label htmlFor="oddRange-min">Min odd count</Label>
        <Input
          id="oddRange-min"
          name="oddRangeMin"
          type="number"
          min={0}
          max={maxOdd}
          value={minOdd}
          onChange={(e) => handleBoundChange("min", e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <Label htmlFor="oddRange-max">Max odd count</Label>
        <Input
          id="oddRange-max"
          name="oddRangeMax"
          type="number"
          min={0}
          max={maxOdd}
          value={maxOddRange}
          onChange={(e) => handleBoundChange("max", e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Label</TableHead>
            <TableHead className="font-medium text-center">Count</TableHead>
            <TableHead className="font-medium text-center">
              Percentage
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distribution.map((r, index) => {
            const inRange =
              r.oddCount >= minOdd && r.oddCount <= maxOddRange;
            return (
              <TableRow
                key={index}
                className={cn(inRange && "bg-secondary")}
                aria-selected={inRange}
              >
                <TableCell>{r.label}</TableCell>
                <TableCell className="text-center">{r.count}</TableCell>
                <TableCell className="text-center">
                  {r.pct.toFixed(2)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
