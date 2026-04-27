import { Card } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Lottery Number Generator",
  description:
    "What this app does, how it works, and what it can't do for you.",
};

const AboutPage = () => {
  return (
    <div className="flex flex-col gap-y-6 w-full">
      <h1 className="text-2xl font-bold">About</h1>

      <Card className="flex flex-col gap-y-3 p-6">
        <h2 className="text-lg font-semibold">What this app is</h2>
        <p className="text-sm leading-relaxed">
          This is a number generator for the UK National Lottery (Lotto and
          Hot Picks): five main numbers from 1–50 plus two lucky numbers from
          1–11. Every draw result going back to the start of the current
          format is pulled in and used to shape what the generator considers
          a &ldquo;plausible-looking&rdquo; set.
        </p>
        <p className="text-sm leading-relaxed">
          Everything runs locally in your browser. No accounts, no tracking,
          no server doing the picking — just a static page that downloads the
          historical draws and does the maths on your device.
        </p>
      </Card>

      <Card className="flex flex-col gap-y-3 p-6">
        <h2 className="text-lg font-semibold">How it works</h2>
        <p className="text-sm leading-relaxed">
          The historical draws are analysed to produce a set of statistical
          thresholds — the typical sum range, odd/even split, gaps between
          adjacent numbers, how often small multiples cluster, and so on.
          You can see and adjust these on the generator page.
        </p>
        <p className="text-sm leading-relaxed">
          The generator then produces random combinations and rejects any
          that fall outside those thresholds, until it finds one that fits.
          The result is a set of numbers that <em>looks</em> like the kind of
          set the lottery has historically drawn.
        </p>
        <p className="text-sm leading-relaxed">
          You can also paste in your own numbers on the{" "}
          <span className="font-mono">Check Numbers</span> page to see how
          often a given combination would have hit each prize tier across the
          historical record, and browse the raw draw history under{" "}
          <span className="font-mono">Historical</span>.
        </p>
      </Card>

      <Card className="flex flex-col gap-y-3 p-6 border-destructive/40">
        <h2 className="text-lg font-semibold">
          What this app does <em>not</em> do
        </h2>
        <p className="text-sm leading-relaxed font-medium">
          It does not improve your odds of winning. It cannot. Nothing can.
        </p>
        <p className="text-sm leading-relaxed">
          Lottery draws are independent random events. The balls have no
          memory of previous draws, so a number that has come up often in the
          past is no more or less likely to be drawn next time than one that
          has never appeared. Believing otherwise is the{" "}
          <a
            href="https://en.wikipedia.org/wiki/Gambler%27s_fallacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            gambler&rsquo;s fallacy
          </a>
          .
        </p>
        <p className="text-sm leading-relaxed">
          Every possible combination — &ldquo;1, 2, 3, 4, 5&rdquo; included —
          has the exact same probability of being drawn as any other. Picking
          &ldquo;hot&rdquo; numbers, avoiding &ldquo;cold&rdquo; ones,
          matching the historical sum range, or following any other pattern
          in this app does not change the underlying odds of matching a
          jackpot, a smaller prize tier, or anything in between.
        </p>
        <p className="text-sm leading-relaxed">
          The only thing number selection can sometimes affect — in
          pari-mutuel tiers like the Lotto jackpot — is how much you
          <em> share</em> a prize with other winners if you happen to win.
          It never affects the probability of winning in the first place.
        </p>
        <p className="text-sm leading-relaxed">
          Treat the generator as a fun way to pick numbers that look
          statistically &ldquo;normal,&rdquo; not as a strategy. The lottery
          is a game of chance. Please play responsibly — set a budget, never
          chase losses, and if gambling stops being fun, support is
          available at{" "}
          <a
            href="https://www.begambleaware.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            BeGambleAware.org
          </a>
          .
        </p>
      </Card>
    </div>
  );
};

export default AboutPage;
