import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// The data room is invitation-only: Auth.js bounces refused sign-ins back here
// with ?error=AccessDenied (uninvited email) or other provider errors.
function errorMessage(error?: string): string | null {
  if (!error) return null;
  if (error === "AccessDenied") {
    return "This email address has not been invited to the data room. Sign in with the exact address your invitation was sent to, or contact us.";
  }
  return "Sign-in failed. Please try again.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const errorMsg = errorMessage(error);
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="max-w-sm mx-auto">
        <div className="card">
          <p className="tag">Data room</p>
          <h1 className="display text-2xl mt-4">Sign in</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Access is by invitation only — use the email address your invitation
            was sent to.
          </p>
          {errorMsg && (
            <p
              role="alert"
              className="text-sm mb-5 border-l-2 border-accent pl-3 py-1"
            >
              {errorMsg}
            </p>
          )}
          <LoginForm callbackUrl={callbackUrl ?? "/dataroom"} />
        </div>
      </div>
    </section>
  );
}
