import ContactForm from "./ContactForm";

export const metadata = {
  title: 'Contact — 2060',
};

export default function Page() {
  return (
    <>
{/* ================== SECTION 1, OVERVIEW ================== */}
    <section className="px-6 pt-16 pb-12 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/contact-us.svg" alt="" aria-hidden="true" className="hero-illustration mb-10" width="3072" height="1536" />
        <p className="tag">Contact</p>
        <h1 className="display text-4xl md:text-5xl mt-4 max-w-3xl">Talk to 2060</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-muted mt-8 reading max-w-2xl">The fastest way to reach us is the form below. We reply within one business day.</p>
        <p className="text-muted mt-3 reading max-w-2xl text-sm">We do not publish email addresses. They collect more spam than signal. Form submissions are handled internally, without exposing any contact endpoint on the public site.</p>
      </div>
    </section>

    {/* ================== SECTION 2, CONTACT FORM ================== */}
    <section className="px-6 py-16 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          {/* Left: context aside */}
          <aside className="md:col-span-4 order-2 md:order-1">
            <p className="tag">Why this form</p>
            <h2 className="display text-2xl mt-4">Routed internally.</h2>
            <ul className="mt-6 space-y-4 text-muted text-sm">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-envelope-open-text text-muted mt-1" aria-hidden="true"></i><span>No email addresses exposed. Nothing in HTML, meta, or JSON-LD.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-shield-halved text-muted mt-1" aria-hidden="true"></i><span>Self-hosted anti-abuse. No Turnstile, hCaptcha, or reCAPTCHA.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-database text-muted mt-1" aria-hidden="true"></i><span>Inquiries are stored in our self-hosted Relaticle CRM (crm.2060.io) so we can follow up. No third-party CRM.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-cookie-bite text-muted mt-1" aria-hidden="true"></i><span>No cookies from this form. The site uses Google Analytics 4 (pageviews only, IP anonymized) &mdash; see the <a href="/privacy" className="prose-link text-fg">Privacy Policy</a>.</span></li>
            </ul>
            <p className="text-xs text-muted mt-8">Full details on the <a href="/privacy" className="prose-link text-fg">Privacy Policy</a>.</p>
          </aside>

          {/* Right: the form */}
          <div className="md:col-span-8 order-1 md:order-2">
            <p className="tag">Request information</p>
            <h2 className="display text-2xl md:text-3xl mt-4">Send a message</h2>
            <p className="text-muted mt-4 text-sm">Every message is routed to the right person on the team within one business day.</p>

            <ContactForm />
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION, POST-FORM ILLUSTRATION ================== */}
    <section className="px-6 py-16 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/enveloppe.svg" alt="" aria-hidden="true" className="hero-illustration" width="3072" height="1536" />
      </div>
    </section>

    {/* ================== SECTION 3, OTHER WAYS ================== */}
    <section className="px-6 py-16 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Other ways to reach us</p>
        <h2 className="display text-2xl md:text-3xl mt-4 max-w-3xl">If the form isn't your preference</h2>
        <ul className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl text-muted">
          <li className="card">
            <h3 className="display text-lg text-fg flex items-center gap-2"><i className="fa-brands fa-fw fa-linkedin" aria-hidden="true"></i>LinkedIn</h3>
            <p className="text-sm mt-3">Founders and core team post regularly. Direct message is fine for informal inquiries.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="https://www.linkedin.com/in/fabricerochette/" className="prose-link text-fg" rel="noopener">Fabrice Rochette (CEO) ↗</a></li>
              <li><a href="https://www.linkedin.com/in/aogentile/" className="prose-link text-fg" rel="noopener">Ariel Gentile (CTO) ↗</a></li>
            </ul>
          </li>
          <li className="card">
            <h3 className="display text-lg text-fg flex items-center gap-2"><i className="fa-brands fa-fw fa-github" aria-hidden="true"></i>GitHub</h3>
            <p className="text-sm mt-3">Open an issue or a pull request.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="https://github.com/2060-io" className="prose-link text-fg" rel="noopener">github.com/2060-io ↗</a></li>
              <li><a href="https://github.com/verana-labs" className="prose-link text-fg" rel="noopener">github.com/verana-labs ↗</a></li>
            </ul>
          </li>
          <li className="card">
            <h3 className="display text-lg text-fg flex items-center gap-2"><i className="fa-solid fa-fw fa-microphone" aria-hidden="true"></i>In person</h3>
            <p className="text-sm mt-3">We present regularly at the <strong className="text-fg">Internet Identity Workshop</strong> and adjacent standards venues.</p>
          </li>
          <li className="card">
            <h3 className="display text-lg text-fg flex items-center gap-2"><i className="fa-solid fa-fw fa-newspaper" aria-hidden="true"></i>Press kit</h3>
            <p className="text-sm mt-3">Logos, founder portraits, and boilerplate are available on request. Use inquiry type <em>Press or analyst</em> on the form above.</p>
          </li>
        </ul>
      </div>
    </section>

    {/* ================== SECTION 4, OFFICE AND LEGAL ================== */}
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <p className="tag">Office and legal</p>
          <h2 className="display text-2xl mt-4">Who you're talking to</h2>
          <div className="accent-line mt-4"></div>
        </div>
        <div className="md:col-span-8">
          <address className="not-italic text-muted leading-relaxed">
            <strong className="text-fg block text-lg">2060 OÜ</strong>
            Ahtri tn 12, 10151 Tallinn, Estonia
          </address>
          <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4 mt-6 text-sm">
            <div><dt className="text-xs tracking-wider uppercase text-muted">Registry code</dt><dd className="text-fg mt-1">16853041</dd></div>
            <div><dt className="text-xs tracking-wider uppercase text-muted">VAT</dt><dd className="text-fg mt-1">EE102810457</dd></div>
            <div><dt className="text-xs tracking-wider uppercase text-muted">Founded</dt><dd className="text-fg mt-1">2023</dd></div>
            <div><dt className="text-xs tracking-wider uppercase text-muted">Incorporated in</dt><dd className="text-fg mt-1">Republic of Estonia</dd></div>
          </dl>
          <p className="text-sm text-muted mt-8">For legal service, GDPR requests, or anything touching the <a href="/privacy" className="prose-link text-fg">Privacy Policy</a>, use inquiry type <em>General inquiry</em> on the form above and begin the message with <em>"Legal:"</em>.</p>
        </div>
      </div>
    </section>
    </>
  );
}
