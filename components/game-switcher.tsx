"use client";

import { ChevronDownIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_GAME_ID, GAMES, getGameById } from "@/lib/games";

export const GameSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentId = searchParams.get("game") ?? DEFAULT_GAME_ID;
  const active = getGameById(currentId) ?? GAMES[0];

  const handleSelect = (id: string) => {
    if (id === active.id) return;
    const params = new URLSearchParams(searchParams.toString());
    // Keep the URL clean: omit the param when it would equal the default.
    if (id === DEFAULT_GAME_ID) params.delete("game");
    else params.set("game", id);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-40 justify-between cursor-pointer"
          aria-label={`Active game: ${active.name}. Click to switch.`}
        >
          <span className="font-medium truncate">{active.name}</span>
          <ChevronDownIcon className="size-4 shrink-0" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={active.id} onValueChange={handleSelect}>
          {GAMES.map((g) => (
            <DropdownMenuRadioItem
              key={g.id}
              value={g.id}
              className="cursor-pointer"
            >
              <div className="flex flex-col leading-tight">
                <span>{g.name}</span>
                {g.drawDays && (
                  <span className="text-muted-foreground text-xs">
                    {g.drawDays}
                  </span>
                )}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
