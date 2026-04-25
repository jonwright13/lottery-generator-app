import {
  generateValidNumberSet,
  type GenerateValidNumberSetOptions,
  type GenerateValidNumberSetResult,
  type LotteryTuple,
} from "@/lib/generator";

export interface WorkerRequest {
  pastNumbers: LotteryTuple[];
  genOptions: Partial<GenerateValidNumberSetOptions>;
}

export type WorkerResponse =
  | { ok: true; res: GenerateValidNumberSetResult }
  | { ok: false; error: string };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { pastNumbers, genOptions } = e.data;
    const res = generateValidNumberSet(pastNumbers, genOptions);
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
