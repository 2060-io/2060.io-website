"use client";

import { useEffect, useState } from "react";

/**
 * Renders a UTC instant in the viewer's own time zone, with the zone named so
 * there is no ambiguity. Until the client mounts (and on robots/no-JS) it
 * shows the unambiguous GMT form, so server and first client render match.
 */
export default function LocalTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const d = new Date(iso);
  const gmt = `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} GMT`;
  if (!mounted) return <span suppressHydrationWarning>{gmt}</span>;

  const text = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
  return (
    <span suppressHydrationWarning title={gmt}>
      {text}
    </span>
  );
}
