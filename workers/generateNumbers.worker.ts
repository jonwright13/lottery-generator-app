import { generateValidNumberSet } from "@/lib/generator";

self.onmessage = (e: MessageEvent) => {
  const { pastNumbers, genOptions } = e.data;
  const res = generateValidNumberSet(pastNumbers, genOptions);
  self.postMessage({ ok: true, res });
};
