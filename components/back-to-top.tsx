"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  /** Show the button once the page has scrolled past this many pixels. */
  threshold?: number;
}

export const BackToTop = ({ threshold = 400 }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      title="Back to top"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full border shadow-lg transition-opacity",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
};
