"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchResults } from "@/components/match-results";
import { SavedSetsList } from "@/components/saved-sets-list";
import { FIELDS } from "@/constants";
import { LotteryTuple } from "@/lib/generator";
import { useMemo, useState } from "react";

const pad2 = (n: number) => String(n).padStart(2, "0");

type Values = Record<string, string>;

const emptyValues = (): Values =>
  Object.fromEntries(FIELDS.map(({ name }) => [name, ""]));

const MAIN_COUNT = 5;

const CheckNumbersPage = () => {
  const [values, setValues] = useState<Values>(emptyValues);

  const padded = useMemo(() => {
    const out: string[] = [];
    for (const { name, max } of FIELDS) {
      const raw = values[name];
      if (raw === "" || raw == null) return null;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > max) return null;
      out.push(pad2(n));
    }
    return out;
  }, [values]);

  const userMain = padded ? padded.slice(0, MAIN_COUNT) : null;
  const userLucky = padded ? padded.slice(MAIN_COUNT) : null;

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
        Enter your numbers below to see how often the historical draws have hit
        each prize tier.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <Card className="flex flex-col gap-y-4 p-4 w-full">
          <form
            className="flex flex-col gap-y-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex gap-x-1 items-center flex-wrap">
              {FIELDS.map(({ name, max }) => (
                <input
                  key={name}
                  type="number"
                  name={name}
                  min={1}
                  max={max}
                  value={values[name]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [name]: e.target.value }))
                  }
                  className="border rounded-sm px-2 py-1 w-8 md:w-12 text-center text-sm md:text-base"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              ))}
            </div>
            <Button
              type="button"
              onClick={() => setValues(emptyValues())}
              className="px-2 py-4 border rounded-md cursor-pointer"
            >
              Clear
            </Button>
          </form>
        </Card>

        <MatchResults userMain={userMain} userLucky={userLucky} />
      </div>

      <h2 className="text-lg font-medium mt-4">Saved sets</h2>
      <p className="text-sm text-muted-foreground">
        Click any set to load it into the form above.
      </p>
      <SavedSetsList onSelect={handleSelectSaved} />
    </>
  );
};

export default CheckNumbersPage;
