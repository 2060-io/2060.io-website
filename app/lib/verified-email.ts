// Pure helpers for the verified-email rule (ported from veranafoundation.org,
// ADR-0002 there). The identity key is a *verified* email; account auto-linking
// is only safe because every sign-in method yields one. Kept separate from the
// Auth.js config so the safety-critical logic is unit-testable without network.

export type GithubEmail = { email: string; primary: boolean; verified: boolean };

/** GitHub's primary *verified* email, falling back to any verified one, else null. */
export function pickGithubVerifiedEmail(emails: GithubEmail[]): string | null {
  const primary = emails.find((e) => e.primary && e.verified);
  if (primary) return primary.email;
  const anyVerified = emails.find((e) => e.verified);
  return anyVerified ? anyVerified.email : null;
}

/** Google asserts `email_verified`; trust the email only when it is true. */
export function isGoogleEmailVerified(
  profile: { email_verified?: boolean } | null | undefined,
): boolean {
  return profile?.email_verified === true;
}
