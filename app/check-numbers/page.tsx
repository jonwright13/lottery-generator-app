"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SavedSetsList } from "@/components/saved-sets-list";
import { FIELDS } from "@/constants";
import { useData } from "@/context/useDataProvider";
import { LotteryTuple } from "@/lib/generator";
import { useState } from "react";
import { toast } from "sonner";

const pad2 = (n: number) => String(n).padStart(2, "0");

type Values = Record<string, string>;

const emptyValues = (): Values =>
  Object.fromEntries(FIELDS.map(({ name }) => [name, ""]));

const CheckNumbersPage = () => {
  const { pastNumbers } = useData();
  const [values, setValues] = useState<Values>(emptyValues);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const nums = FIELDS.map(({ name, max }) => {
        const n = Number(values[name]);

        if (!Number.isInteger(n)) {
          throw new Error(`Invalid value for ${name}`);
        }

        if (n < 1 || n > max) {
          throw new Error(`${name} must be between 1 and ${max}`);
        }

        return pad2(n);
      }) as LotteryTuple;

      const pastSet = new Set(pastNumbers.map((row) => row.join(",")));
      const match = pastSet.has(nums.join(","));

      if (match) {
        toast.success("Match found", {
          description: "These numbers were drawn in the historical data.",
        });
      } else {
        toast("No exact match", {
          description: "These numbers have not been drawn before.",
        });
      }
    } catch (err) {
      console.error("Error checking numbers", err);
      toast.error("Could not check numbers", {
        description: err instanceof Error ? err.message : "Invalid input",
      });
    }
  };

  const handleSelectSaved = (numbers: LotteryTuple) => {
    setValues(
      Object.fromEntries(
        FIELDS.map(({ name }, i) => [name, String(Number(numbers[i]))]),
      ),
    );
  };

  return (
    <>
      <h1 className="text-2xl font-bold mx-auto md:mx-0">Check Numbers</h1>
      <p className="text-center md:text-left">
        Enter your numbers into the fields below to check whether they have been
        drawn in the past.
      </p>
      <Card className="flex flex-col gap-y-4 p-4 w-fit mx-auto md:mx-0">
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
                value={values[name]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [name]: e.target.value }))
                }
                className="border rounded-sm px-2 py-1 w-8 md:w-12 text-center text-sm md:text-base"
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
              type="button"
              onClick={() => setValues(emptyValues())}
              className="px-2 py-4 border rounded-md cursor-pointer"
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="text-lg font-medium mt-4">Saved sets</h2>
      <p className="text-sm text-muted-foreground">
        Click any set to load it into the form above.
      </p>
      <SavedSetsList onSelect={handleSelectSaved} />
    </>
  );
};

export default CheckNumbersPage;
