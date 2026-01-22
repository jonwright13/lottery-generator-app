"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FIELDS } from "@/constants";
import { useData } from "@/context/useDataProvider";

const ViewHistoricalPage = () => {
  const { pastNumbers, updatedAt, dates } = useData();

  if (!pastNumbers) return <h1>Loading...</h1>;

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <h1 className="text-2xl font-bold">Past Lottery Numbers</h1>
      <p className="text-sm font-light">
        Last updated:{" "}
        {updatedAt ? new Date(updatedAt).toLocaleString() : "Unknown"}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Date</TableHead>
            {FIELDS.map((f) => (
              <TableHead key={f.name}>{f.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pastNumbers.map((row, y) => (
            <TableRow key={`${y}-${row.join("-")}`}>
              <TableCell>{dates?.[y]}</TableCell>
              {row.map((c, x) => (
                <TableCell key={`${x}-${row.join("-")}`}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ViewHistoricalPage;
