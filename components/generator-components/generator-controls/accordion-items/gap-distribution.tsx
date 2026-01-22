import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export const GapDistributionItem = ({
  analysis,
  genOptions,
  updateOptions,
}: TableItemProps) => {
  const handleGapChange = (
    key: "maxMainGapThreshold" | "maxLuckyGapThreshold",
    gap: number,
  ) => {
    if (!analysis) return;
    if (gap === genOptions.maxMainGapThreshold) return;
    updateOptions(key, gap);
  };

  const counters = analysis?.gapDistributionData.main.gapCounters ?? [];

  // Collect all gap keys that exist across all counters
  const allGaps = Array.from(
    new Set(counters.flatMap((obj) => Object.keys(obj))),
  )
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <p>
        Gap distributions measure the distance between consecutive numbers in a
        draw. Smaller gaps indicate clustered numbers, while larger gaps
        indicate more spread-out selections.
      </p>
      <Accordion type="single" collapsible>
        <AccordionItem value="main-gap-dist">
          <AccordionTrigger>Main Numbers</AccordionTrigger>
          <AccordionContent>
            <p>
              Each column represents the gap between two adjacent main numbers
              after sorting. Rows show how frequently a given gap size appears
              across historical draws. Selecting row to adjust the max gap size
              used in generation.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gap</TableHead>
                  {analysis?.gapDistributionData.main.gapCounters.map(
                    (_, index) => (
                      <TableHead key={index} className="font-medium">
                        N{index + 1} to N{index + 2}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allGaps.map((gap) => (
                  <TableRow
                    key={gap}
                    className={cn(
                      "cursor-pointer hover:bg-secondary",
                      gap === genOptions.maxMainGapThreshold && "bg-secondary",
                    )}
                    onClick={() => handleGapChange("maxMainGapThreshold", gap)}
                  >
                    <TableCell className="font-medium text-center">
                      {gap}
                    </TableCell>

                    {counters.map((counterObj, idx) => (
                      <TableCell key={idx} className={cn("text-center")}>
                        {counterObj[gap] ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="lucky-gap-dist">
          <AccordionTrigger>Lucky Numbers</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <p>
              Each column represents the gap between two adjacent lucky numbers
              after sorting. Rows show how frequently a given gap size appears
              across historical draws. Selecting row to adjust the max gap size
              used in generation.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Gap</TableHead>
                  <TableHead className="text-center">N1 to N2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(
                  analysis?.gapDistributionData.lucky.gapCounters[0] ?? {},
                ).map(([gap, count]) => (
                  <TableRow
                    key={gap}
                    className={cn(
                      "cursor-pointer hover:bg-secondary",
                      Number(gap) === genOptions.maxLuckyGapThreshold &&
                        "bg-secondary",
                    )}
                    onClick={() =>
                      handleGapChange("maxLuckyGapThreshold", Number(gap))
                    }
                  >
                    <TableCell className="font-medium text-center">
                      {gap}
                    </TableCell>
                    <TableCell className="text-center">{count ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};
