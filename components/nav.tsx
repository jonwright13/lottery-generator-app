"use client";

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
      <div className="flex gap-x-8 items-center">
        <nav>
          <ul className="flex gap-x-8 items-center">
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
              <a href="/view-historical" className="hover:underline">
                View Historical
              </a>
            </li>
            <li>
              <a href="/about" className="hover:underline">
                About
              </a>
            </li>
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
};
