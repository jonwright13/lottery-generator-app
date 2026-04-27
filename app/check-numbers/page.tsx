"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchResults } from "@/components/match-results";
import { SavedSetsList } from "@/components/saved-sets-list";
import { FIELDS } from "@/constants";
import { useSavedNumbers } from "@/hooks/use-saved-numbers";
import { LotteryTuple } from "@/lib/generator";
import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const pad2 = (n: number) => String(n).padStart(2, "0");

type Values = Record<string, string>;

const emptyValues = (): Values =>
  Object.fromEntries(FIELDS.map(({ name }) => [name, ""]));

const MAIN_COUNT = 5;

const CheckNumbersPage = () => {
  const [values, setValues] = useState<Values>(emptyValues);
  const { list: savedList, add: saveNumbers, remove: removeSaved } =
    useSavedNumbers();

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

  const currentKey = padded?.join(",") ?? null;
  const savedEntry = currentKey
    ? savedList.find((s) => s.numbers.join(",") === currentKey)
    : undefined;

  const handleSelectSaved = (numbers: LotteryTuple) => {
    setValues(
      Object.fromEntries(
        FIELDS.map(({ name }, i) => [name, String(Number(numbers[i]))]),
      ),
    );
  };

  const handleToggleSave = () => {
    if (!padded) return;
    if (savedEntry) {
      removeSaved(savedEntry.id);
      toast("Removed from saved");
    } else {
      saveNumbers(padded as LotteryTuple);
      toast.success("Saved");
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startName: string,
  ) => {
    const text = e.clipboardData.getData("text");
    // Split on whitespace and commas; drop tokens that aren't pure digits
    // (so an ISO date like "2026-04-24" pasted from the historical table is
    // skipped entirely rather than mangled into 2026 / 04 / 24).
    const tokens = text.split(/[\s,]+/).filter((t) => /^\d+$/.test(t));
    if (tokens.length < 2) return;

    const startIdx = FIELDS.findIndex((f) => f.name === startName);
    if (startIdx < 0) return;

    e.preventDefault();
    setValues((prev) => {
      const next = { ...prev };
      let cursor = startIdx;
      for (const tok of tokens) {
        if (cursor >= FIELDS.length) break;
        const { name, max } = FIELDS[cursor];
        const n = Number(tok);
        if (Number.isInteger(n) && n >= 1 && n <= max) {
          next[name] = String(n);
        }
        cursor++;
      }
      return next;
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold mx-auto md:mx-0">Check Numbers</h1>
      <p className="text-center md:text-left">
        Enter your numbers below to see how often the historical draws have hit
        each prize tier.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-start">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-y-4 p-4 w-full">
            <h3 className="text-lg font-semibold">Your numbers</h3>
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
                    onPaste={(e) => handlePaste(e, name)}
                    className="border rounded-sm px-2 py-1 w-8 md:w-12 text-center text-sm md:text-base"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                ))}
              </div>
              <div className="flex gap-x-2">
                <Button
                  type="button"
                  onClick={() => setValues(emptyValues())}
                  className="flex-1 px-2 py-4 border rounded-md cursor-pointer"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant={savedEntry ? "default" : "outline"}
                  disabled={!padded}
                  onClick={handleToggleSave}
                  title={
                    !padded
                      ? "Fill in all numbers to save"
                      : savedEntry
                        ? "Saved — click to remove"
                        : "Save these numbers"
                  }
                >
                  {savedEntry ? <BookmarkCheckIcon /> : <BookmarkIcon />}
                  {savedEntry ? "Saved" : "Save"}
                </Button>
              </div>
            </form>
          </Card>

          <MatchResults userMain={userMain} userLucky={userLucky} />
        </div>

        <SavedSetsList onSelect={handleSelectSaved} />
      </div>
    </>
  );
};

export default CheckNumbersPage;
