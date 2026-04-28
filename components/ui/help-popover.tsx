"use client";

import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HelpPopoverProps {
  title: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const HelpPopover = ({
  title,
  children,
  className,
  ariaLabel,
}: HelpPopoverProps) => (
  <Popover>
    <PopoverTrigger
      className={cn(
        "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
        className,
      )}
      aria-label={ariaLabel ?? `What does “${title}” show?`}
    >
      <HelpCircle className="size-5" aria-hidden />
    </PopoverTrigger>
    <PopoverContent
      align="end"
      sideOffset={6}
      className="w-80 max-w-[calc(100vw-2rem)] text-sm"
    >
      <div className="flex flex-col gap-y-2">
        <h3 className="text-sm font-medium leading-tight">{title}</h3>
        <div className="text-xs leading-relaxed text-muted-foreground space-y-2">
          {children}
        </div>
      </div>
    </PopoverContent>
  </Popover>
);
