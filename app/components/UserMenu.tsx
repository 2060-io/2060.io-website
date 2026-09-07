"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type MeUser = { name: string | null; email: string; image: string | null };
type MeAction = { label: string; href: string; icon: string };

const ICONS: Record<string, string> = {
  shield: "fa-shield-halved",
  users: "fa-users",
  folder: "fa-folder-open",
};

/** Avatar label: name initials, else first-of-local + first-of-domain. */
function avatarLabel(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase();
  }
  const [local, domain] = email.split("@");
  return `${local?.[0] ?? ""}${domain?.[0] ?? ""}`.toUpperCase() || "?";
}

type Me = { user: MeUser; actions: MeAction[] };

/**
 * Header account control. Fetches /api/me on mount so the public pages stay
 * static: while loading nothing renders (no flash), a signed-out visitor gets
 * a "Sign in" link, and a signed-in data-room user gets the avatar menu.
 */
export default function UserMenu() {
  // undefined = still loading, null = signed out.
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data?.user ? (data as Me) : null);
      })
      .catch(() => {
        if (!cancelled) setMe(null); // offline — treat as signed out
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (me === undefined) return null;
  if (me === null) {
    return (
      <Link href="/login" className="nav-link text-sm whitespace-nowrap">
        Sign in
      </Link>
    );
  }
  const { user, actions } = me;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="block h-8 w-8 rounded-full overflow-hidden border hairline"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-8 w-8 object-cover" />
        ) : (
          <span
            className="grid h-8 w-8 place-items-center text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            {avatarLabel(user.name, user.email)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 border hairline py-1 text-sm z-50 shadow-lg"
          style={{ background: "var(--bg)" }}
        >
          <div className="px-3 py-2">
            <div className="text-xs text-muted">Signed in as</div>
            <div className="font-medium truncate text-fg">{user.email}</div>
          </div>
          <div className="border-t hairline my-1" />
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-fg hover:text-accent-hover"
            >
              <i
                className={`fa-solid fa-fw ${ICONS[a.icon] ?? "fa-circle"} text-muted`}
                aria-hidden="true"
              ></i>
              {a.label}
            </Link>
          ))}
          {actions.length > 0 && <div className="border-t hairline my-1" />}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-fg hover:text-accent-hover"
          >
            <i className="fa-solid fa-fw fa-right-from-bracket text-muted" aria-hidden="true"></i>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
