"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const NOT_INVITED =
  "This email address has not been invited to the data room. Sign in with the exact address your invitation was sent to, or contact us.";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-shrink-0">
      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);

  /**
   * Request an OTP code. Invitation-only: the signIn callback refuses uninvited
   * emails before any code is sent, which surfaces here as AccessDenied — show
   * the invite message instead of the "code sent" screen.
   */
  async function sendCode(): Promise<boolean> {
    setPending(true);
    setError("");
    const res = await signIn("nodemailer", {
      email: email.trim().toLowerCase(),
      callbackUrl,
      redirect: false,
    });
    setPending(false);
    const failed =
      res?.error === "AccessDenied" || res?.url?.includes("error=AccessDenied");
    if (failed) {
      setError(NOT_INVITED);
      return false;
    }
    setSent(true);
    return true;
  }

  /**
   * Verify the code against Auth.js's email-provider callback. Fetching (not
   * navigating) lets us keep the form state on a wrong code: the callback 302s
   * either to the destination (session cookie set) or back to /login?error=….
   */
  async function verifyCode() {
    setPending(true);
    setError("");
    const params = new URLSearchParams({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      callbackUrl,
    });
    const res = await fetch(`/api/auth/callback/nodemailer?${params}`);
    if (res.url.includes("error=")) {
      setPending(false);
      setCode("");
      setError(
        res.url.includes("error=AccessDenied")
          ? NOT_INVITED
          : "That code is invalid or has expired — try again or resend.",
      );
      return;
    }
    window.location.href = callbackUrl;
  }

  if (sent) {
    return (
      <div className="py-2">
        <div className="text-center">
          <i className="fa-solid fa-circle-check text-3xl text-accent-hover" aria-hidden="true"></i>
          <p className="text-sm text-muted mt-3">
            We emailed a 6-digit code to{" "}
            <strong className="text-fg">{email}</strong>.
          </p>
        </div>
        <form
          className="flex flex-col gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim().length === 6) void verifyCode();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="field text-center text-2xl tracking-[0.4em] font-mono"
            aria-label="Sign-in code"
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={pending || code.length !== 6}
          >
            {pending ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
        <div className="flex justify-between text-xs text-muted mt-3">
          <button
            type="button"
            className="hover:text-fg underline-offset-2 hover:underline"
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
              setResent(false);
            }}
          >
            Use a different email
          </button>
          <button
            type="button"
            className="hover:text-fg underline-offset-2 hover:underline disabled:opacity-50"
            disabled={pending || resent}
            onClick={async () => {
              if (await sendCode()) setResent(true);
            }}
          >
            {resent ? "Code resent" : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="btn w-full flex items-center justify-center gap-2.5"
      >
        <GoogleLogo /> Continue with Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl })}
        className="btn w-full flex items-center justify-center gap-2.5"
      >
        <i className="fa-brands fa-github text-base" aria-hidden="true"></i>{" "}
        Continue with GitHub
      </button>

      <div className="flex items-center gap-3 my-1 text-xs text-muted">
        <span className="h-px flex-1 border-t hairline" />
        or
        <span className="h-px flex-1 border-t hairline" />
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendCode();
        }}
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field text-sm"
          aria-label="Email address"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
          {pending ? "Sending…" : "Email me a sign-in code"}
        </button>
      </form>
    </div>
  );
}
