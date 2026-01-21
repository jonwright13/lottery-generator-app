import { generateValidNumberSet } from "@/lib/generate-number-set";

self.onmessage = (e: MessageEvent) => {
  const { pastNumbers, genOptions } = e.data;
  const res = generateValidNumberSet(pastNumbers, genOptions);
  self.postMessage({ ok: true, res });
};
