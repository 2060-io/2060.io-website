"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/investors", label: "Investors" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.classList.contains("light") ? "dark" : "light";
    try {
      localStorage.setItem("2060-theme", next);
    } catch {
      /* ignore */
    }
    if (next === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b hairline nav-bg">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-fg" aria-label="2060 home">
          <span className="logo-2060 h-5 text-fg" aria-hidden="true"></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link"
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/2060-io"
            className="nav-link"
            rel="noopener"
          >
            GitHub ↗
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-theme-toggle
            className="theme-toggle"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            suppressHydrationWarning
          >
            <span data-theme-icon aria-hidden="true"></span>
          </button>
          <button
            type="button"
            className="md:hidden w-9 h-9 flex items-center justify-center border hairline text-muted"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </button>
        </div>
      </div>
      {mounted && menuOpen && (
        <div className="md:hidden border-t hairline">
          <nav className="px-6 py-4 flex flex-col gap-3 text-sm" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={isActive(l.href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/2060-io"
              className="nav-link"
              rel="noopener"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
