import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DistributionAnalysis } from "@/lib/generator";
import { cn } from "@/lib/utils";
import { TableItemProps } from "../types";

export const OddEvenDistItem = ({
  analysis,
  genOptions,
  updateOptions,
}: TableItemProps) => {
  const handleOddRangeChange = (r: DistributionAnalysis) => {
    if (!analysis) return;
    if (
      r.oddCount === genOptions.oddRange[0] ||
      r.oddCount === genOptions.oddRange[1]
    )
      return;

    const index = analysis.distribution.findIndex(
      (row) => row.label === r.label,
    );
    const middleIndex = analysis.distribution.length / 2;

    let prevRange = genOptions.oddRange;
    if (index < middleIndex) {
      prevRange[0] = r.oddCount;
    } else {
      prevRange[1] = r.oddCount;
    }

    updateOptions("oddRange", prevRange);
  };

  return (
    <>
      <p>
        This table breaks down historical draws by how many odd versus even
        numbers they contain. Click a row to adjust the min/max range used in
        generation.
      </p>
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
          {analysis?.distribution.map((r, index) => (
            <TableRow
              key={index}
              className={cn(
                "cursor-pointer hover:bg-slate-300",
                r.oddCount === genOptions.oddRange[0] && "bg-secondary",
                r.oddCount === genOptions.oddRange[1] && "bg-secondary",
              )}
              onClick={() => handleOddRangeChange(r)}
            >
              <TableCell>{r.label}</TableCell>
              <TableCell className="text-center">{r.count}</TableCell>
              <TableCell className="text-center">{r.pct.toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
