"use client";

import { Card } from "@/components/ui/card";
import type { MouseEvent } from "react";

export interface SectionItem {
  id: string;
  label: string;
}

interface Props {
  sections: ReadonlyArray<SectionItem>;
}

const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (typeof history !== "undefined") {
    history.replaceState(null, "", `#${id}`);
  }
};

export const SectionToc = ({ sections }: Props) => {
  return (
    <Card className="flex flex-col gap-y-2 p-4 w-full">
      <h2 className="text-sm font-medium text-muted-foreground">
        Jump to section
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => handleAnchorClick(e, s.id)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
};
