/**
 * Fixed-window rate limiter, in-memory (per pod — fine for this single-replica
 * site). Used by the MCP server per access token.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimitAllow(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { allowed: boolean; remaining: number; resetAt: number } {
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  w.count++;
  return { allowed: w.count <= limit, remaining: Math.max(0, limit - w.count), resetAt: w.resetAt };
}

/** Test hook. */
export function resetRateLimits(): void {
  windows.clear();
}
