"use client";

import { useSearchParams } from "next/navigation";

// Preserve `?game=` across in-app navigation so switching pages doesn't
// silently revert a non-default game back to the default. Pages always
// read the active game from the URL.
export const useGameAwareHref = () => {
  const sp = useSearchParams();
  const game = sp.get("game");
  return (path: string) => (game ? `${path}?game=${game}` : path);
};
