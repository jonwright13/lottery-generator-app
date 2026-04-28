import {
  generateValidNumberSet,
  type GenerateValidNumberSetOptions,
  type GenerateValidNumberSetResult,
  type LotteryTuple,
} from "@/lib/generator";

export interface WorkerRequest {
  pastNumbers: LotteryTuple[];
  genOptions: Partial<GenerateValidNumberSetOptions>;
  positionCounters?: Array<Record<string, number>>;
  pairCounts?: Record<string, number>;
  tripletCounts?: Record<string, number>;
}

export type WorkerResponse =
  | { ok: true; res: GenerateValidNumberSetResult }
  | { ok: false; error: string };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const {
      pastNumbers,
      genOptions,
      positionCounters,
      pairCounts,
      tripletCounts,
    } = e.data;
    const res = generateValidNumberSet(
      pastNumbers,
      genOptions,
      positionCounters,
      pairCounts,
      tripletCounts,
    );
    const reply: WorkerResponse = { ok: true, res };
    self.postMessage(reply);
  } catch (err) {
    const reply: WorkerResponse = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(reply);
  }
};
