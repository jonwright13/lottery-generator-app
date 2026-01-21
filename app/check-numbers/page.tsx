"use client";

import { Button } from "@/components/ui/button";
import { FIELDS } from "@/constants";
import { useData } from "@/context/useDataProvider";
import { LotteryTuple } from "@/types";

const pad2 = (n: number) => String(n).padStart(2, "0");

const CheckNumbersPage = () => {
  const { pastNumbers } = useData();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      if (!Array.isArray(pastNumbers) || pastNumbers.length === 0) {
        alert("No numbers to check against. Try refreshing the page");
        return;
      }

      // Parse, validate, and pad input
      const nums = FIELDS.map(({ name, max }) => {
        const raw = formData.get(name);
        const n = Number(raw);

        if (!Number.isInteger(n)) {
          throw new Error(`Invalid value for ${name}`);
        }

        if (n < 1 || n > max) {
          throw new Error(`${name} must be between 1 and ${max}`);
        }

        return pad2(n);
      }) as LotteryTuple;

      // Lookup
      const pastSet = new Set(pastNumbers.map((row) => row.join(",")));
      const match = pastSet.has(nums.join(","));

      alert(match ? "Match found" : "No matches found");
    } catch (err) {
      console.log("Error checking numbers", err);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Check Numbers</h1>
      <p>
        Enter your numbers into the fields below to check whether they have been
        drawn in the past.
      </p>
      <div className="flex flex-col gap-y-4">
        <form className="flex flex-col gap-y-2" onSubmit={handleSubmit}>
          <div className="flex gap-x-1 items-center">
            {FIELDS.map(({ name, max }) => (
              <input
                key={name}
                type="number"
                name={name}
                min={1}
                max={max}
                required
                className="border rounded-sm p-1 w-8 text-center"
                onWheel={(e) => e.currentTarget.blur()}
              />
            ))}
          </div>
          <div className="flex gap-x-2 justify-between">
            <Button
              type="submit"
              className="flex-1 px-2 py-4 border rounded-md cursor-pointer"
            >
              Check
            </Button>
            <Button
              type="reset"
              className="px-2 py-4 border rounded-md cursor-pointer"
            >
              Clear
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CheckNumbersPage;
