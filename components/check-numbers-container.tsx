"use client";

import { getLatestLotteryNumbers } from "@/actions/get-latest-numbers";
import { LotteryTuple } from "@/types";

export const CheckNumbersContainer = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const response = await fetch("/data/external-data.json");
    const data = await response.json();
    const pastNumbers: LotteryTuple[] = data.results;

    if (!pastNumbers)
      return alert("No numbers to check against. Try refreshing the page");

    // Helper to pad values safely
    const getPadded = (key: string) => {
      const raw = formData.get(key);
      if (!raw) return "00"; // fallback
      return raw.toString().padStart(2, "0");
    };

    const nums: LotteryTuple = [
      getPadded("num-1"),
      getPadded("num-2"),
      getPadded("num-3"),
      getPadded("num-4"),
      getPadded("num-5"),
      getPadded("num-6"),
      getPadded("num-7"),
    ];

    // Check for a match using deep comparison
    const match = pastNumbers.some((row) =>
      row.every((val, idx) => val === nums[idx])
    );

    alert(match ? "Match found" : "No matches found");
  };

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-lg font-semibold">Check Numbers</h2>
      <form className="flex flex-col gap-y-2" onSubmit={handleSubmit}>
        <div className="flex gap-x-1 items-center">
          <input
            type="number"
            name="num-1"
            min={1}
            max={50}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-2"
            min={1}
            max={50}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-3"
            min={1}
            max={50}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-4"
            min={1}
            max={50}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-5"
            min={1}
            max={50}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-6"
            min={1}
            max={11}
            required
            className="border rounded-sm p-1 w-8"
          />
          <input
            type="number"
            name="num-7"
            min={1}
            max={11}
            required
            className="border rounded-sm p-1 w-8"
          />
        </div>
        <div className="flex gap-x-2 justify-between">
          <button
            type="submit"
            className="flex-1 px-2 py-4 border rounded-md cursor-pointer"
          >
            Check
          </button>
          <button
            type="reset"
            className="px-2 py-4 border rounded-md cursor-pointer"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};
