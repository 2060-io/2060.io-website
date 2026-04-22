"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Wires up IntersectionObserver-based fade-up reveal for any element
 * with the `.reveal` class. Re-runs on route change so new content
 * becomes observable. Honours `prefers-reduced-motion`.
 */
export default function Reveals() {
  const pathname = usePathname();

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
