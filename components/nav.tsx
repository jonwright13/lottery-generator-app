"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GameSwitcher } from "@/components/game-switcher";
import { cn } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

// Preserve `?game=` across in-app navigation so switching pages doesn't
// silently revert a non-default game back to the default. Pages always
// read the active game from the URL.
const useGameAwareHref = () => {
  const sp = useSearchParams();
  const game = sp.get("game");
  return (path: string) => (game ? `${path}?game=${game}` : path);
};

interface NavLinkProps {
  href: string;
  path: string;
  label: string;
}

const NavLink = ({ href, path, label }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === path;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "transition-colors hover:underline underline-offset-4 decoration-2",
        isActive
          ? "text-foreground underline"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
};

export const Navbar = () => {
  const withGame = useGameAwareHref();

  return (
    <header className="flex gap-x-4 lg:gap-x-8 justify-between border p-4 items-center w-full">
      <div className="flex items-center gap-x-3 lg:gap-x-4 min-w-0">
        <Link
          href={withGame("/")}
          className="text-base lg:text-lg font-medium lg:font-semibold hover:text-accent-foreground hover:underline truncate"
        >
          <h1>Lottery Number Generator</h1>
        </Link>
        <GameSwitcher />
      </div>

      {/* Large screen navbar */}
      <div className="hidden lg:flex gap-x-8 items-center">
        <NavItems />
        <ThemeToggle />
      </div>

      {/* Mobile menu */}
      <div className="flex lg:hidden gap-x-4 items-center">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MenuIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-4">
            <NavItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const NavItems = () => {
  const withGame = useGameAwareHref();
  return (
    <nav>
      <ul className="flex flex-col lg:flex-row gap-2 lg:gap-8 items-start lg:items-center">
        <li>
          <NavLink href={withGame("/")} path="/" label="Generate" />
        </li>
        <li>
          <NavLink
            href={withGame("/check-numbers")}
            path="/check-numbers"
            label="Check Numbers"
          />
        </li>
        <li>
          <NavLink
            href={withGame("/analysis")}
            path="/analysis"
            label="Analysis"
          />
        </li>
        <li>
          <NavLink
            href={withGame("/historical")}
            path="/historical"
            label="Historical"
          />
        </li>
        <li>
          <NavLink href={withGame("/about")} path="/about" label="About" />
        </li>
      </ul>
    </nav>
  );
};
