"use client";

import { useEffect, useRef, useState } from "react";

const TOPICS = [
  { value: "investor", label: "Investor: equity round, investor memo, data-room access" },
  { value: "enterprise", label: "Enterprise or consortium: Hologram deployment, trust-registry engagement" },
  { value: "press", label: "Press or analyst" },
  { value: "hiring", label: "Hiring: send work, not résumés" },
  { value: "general", label: "General inquiry" },
];

const MIN_MESSAGE = 50;
const MAX_MESSAGE = 4000;

const VALIDATION_MSG = `Please complete the required fields — a valid email and a message of at least ${MIN_MESSAGE} characters — then try again.`;
const SUBMIT_MSG =
  "Sorry, we couldn't send your message just now. Please try again in a moment, or reach a founder on LinkedIn.";

export default function ContactForm() {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [renderedAt, setRenderedAt] = useState("");
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRenderedAt(String(Date.now()));
    const params = new URLSearchParams(window.location.search);
    const t = params.get("topic");
    if (t && TOPICS.some((o) => o.value === t)) setTopic(t);
  }, []);

  // Make the outcome visible (especially on mobile) by scrolling the banner
  // into view on success/error.
  useEffect(() => {
    if (status === "success" || status === "error") {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const honeypot = (form.elements.namedItem("website_hp") as HTMLInputElement)
      ?.value;
    if (honeypot) {
      setStatus("success");
      return;
    }

    if (!form.checkValidity() || message.trim().length < MIN_MESSAGE) {
      form.reportValidity();
      setErrorMsg(VALIDATION_MSG);
      setStatus("error");
      return;
    }

    const fd = new FormData(form);
    const payload = {
      topic: fd.get("topic"),
      name: fd.get("name"),
      email: fd.get("email"),
      organization: fd.get("organization"),
      role: fd.get("role"),
      linkedin: fd.get("linkedin"),
      company_website: fd.get("company_website"),
      message: fd.get("message"),
      source: fd.get("source"),
      consent: (form.elements.namedItem("consent") as HTMLInputElement)?.checked,
      website_hp: honeypot ?? "",
      rendered_at: renderedAt,
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      form.reset();
      setTopic("");
      setMessage("");
    } catch {
      setErrorMsg(SUBMIT_MSG);
      setStatus("error");
    }
  }

  // Success — replace the form with a prominent confirmation banner.
  if (status === "success") {
    return (
      <div
        ref={bannerRef}
        role="status"
        aria-live="polite"
        className="mt-8 card"
        style={{ borderLeft: "4px solid #1FB57A" }}
      >
        <h3 className="display text-lg text-fg flex items-center gap-2">
          <span aria-hidden="true" style={{ color: "#1FB57A" }}>
            ✓
          </span>
          Message sent
        </h3>
        <p className="text-muted mt-2">
          Thank you — we received your inquiry and will reply within one business
          day. For urgent matters, reach a founder on LinkedIn.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";
  const errored = status === "error";

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Error banner — keeps the form so it can be re-submitted. */}
      {errored && (
        <div
          ref={bannerRef}
          role="alert"
          aria-live="assertive"
          className="card"
          style={{
            borderLeft: "4px solid #e5484d",
            background: "rgba(229, 72, 77, 0.08)",
          }}
        >
          <h3
            className="display text-lg"
            style={{ color: "#e5484d" }}
          >
            Couldn&rsquo;t send your message
          </h3>
          <p className="text-muted mt-2 text-sm">{errorMsg}</p>
          <button
            type="submit"
            className="btn btn-primary mt-4"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Try again"}
          </button>
        </div>
      )}

      {/* Honeypot (hidden from users) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Leave this field empty:{" "}
          <input name="website_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="rendered_at" value={renderedAt} readOnly />

      <div>
        <label htmlFor="topic" className="block text-sm font-medium mb-2">
          Inquiry type <span className="text-accent-hover" aria-hidden="true">*</span>
        </label>
        <select
          id="topic"
          name="topic"
          required
          className="field"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="">Select one</option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name <span className="text-accent-hover" aria-hidden="true">*</span>
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email <span className="text-accent-hover" aria-hidden="true">*</span>
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium mb-2">
          Your LinkedIn <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="linkedin"
          name="linkedin"
          type="url"
          autoComplete="url"
          className="field"
          placeholder="https://www.linkedin.com/in/…"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="organization" className="block text-sm font-medium mb-2">
            Organization{" "}
            <span className="text-muted text-xs">
              (required for investor / enterprise / press)
            </span>
          </label>
          <input id="organization" name="organization" type="text" autoComplete="organization" className="field" />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-2">
            Role or title <span className="text-muted text-xs">(optional)</span>
          </label>
          <input id="role" name="role" type="text" autoComplete="organization-title" className="field" placeholder="Partner, CTO, head of …" />
        </div>
      </div>

      <div>
        <label htmlFor="company_website" className="block text-sm font-medium mb-2">
          Company Website <span className="text-muted text-xs">(optional)</span>
        </label>
        <input id="company_website" name="company_website" type="url" className="field" placeholder="https://…" />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message <span className="text-accent-hover" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={MIN_MESSAGE}
          maxLength={MAX_MESSAGE}
          className="field"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you building or evaluating, what is the question, and what timeline are you on?"
        />
        <p className="text-xs text-muted mt-2">
          {message.length} / {MAX_MESSAGE} (min {MIN_MESSAGE})
        </p>
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium mb-2">
          How did you hear about us <span className="text-muted text-xs">(optional)</span>
        </label>
        <select id="source" name="source" className="field">
          <option value="">(none)</option>
          <option>GitHub</option>
          <option>IIW or standards venue</option>
          <option>Verana</option>
          <option>Referral</option>
          <option>Search</option>
          <option>Other</option>
        </select>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input id="consent" name="consent" type="checkbox" required className="mt-1" />
        <label htmlFor="consent" className="text-sm text-muted">
          I consent to 2060 OÜ storing this inquiry to respond to me. See the{" "}
          <a href="/privacy" className="prose-link text-fg">
            Privacy Policy
          </a>
          . <span className="text-accent-hover" aria-hidden="true">*</span>
        </label>
      </div>

      <div className="pt-4 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </button>
        <span className="text-xs text-muted">
          We reply within one business day. For urgent matters, reach a founder
          on LinkedIn.
        </span>
      </div>
    </form>
  );
}
