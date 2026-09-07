/**
 * Best-effort ops alert to a Discord/Slack-compatible webhook
 * (ALERT_WEBHOOK_URL). No-op when unset; never throws.
 */
export async function alertOps(message: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
      cache: "no-store",
    });
  } catch {
    /* swallow — alerting must never throw */
  }
}
