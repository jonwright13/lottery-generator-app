"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = () => {
  return (
    <header className="flex gap-x-8 justify-between border p-4 items-center w-full">
      <Link
        href="/"
        className="text-base lg:text-lg font-medium lg:font-semibold hover:text-accent-foreground hover:underline"
      >
        <h1>Lottery Number Generator</h1>
      </Link>

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
  return (
    <nav>
      <ul className="flex flex-col lg:flex-row gap-2 lg:gap-8 items-start lg:items-center">
        <li>
          <a href="/" className="hover:underline">
            Generate
          </a>
        </li>
        <li>
          <a href="/check-numbers" className="hover:underline">
            Check Numbers
          </a>
        </li>
        <li>
          <a href="/historical" className="hover:underline">
            Historical
          </a>
        </li>
        <li>
          <a href="/about" className="hover:underline">
            About
          </a>
        </li>
      </ul>
    </nav>
  );
};
