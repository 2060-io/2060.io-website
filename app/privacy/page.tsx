export const metadata = {
  title: 'Privacy Policy — 2060',
};

export default function Page() {
  return (
    <>
{/* ================== SECTION 1, OVERVIEW ================== */}
    <section className="px-6 pt-16 pb-12 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Legal</p>
        <h1 className="display text-4xl md:text-5xl mt-4">Privacy Policy</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-xs tracking-wider uppercase text-muted mt-8"><strong className="text-fg">Last updated.</strong> 2026-04-22</p>
        <div className="reading max-w-3xl mt-8 space-y-5 text-e5">
          <p>This page explains what personal data <strong className="text-fg">2060 OÜ</strong> collects through <strong className="text-fg">2060.io</strong>, why we collect it, how long we keep it, and what rights you have under the EU General Data Protection Regulation (GDPR). The policy covers the <strong className="text-fg">contact form</strong> on <code>/contact</code> and any cookies or anti-abuse signals set by the site.</p>
          <p>2060.io does not sell data and does not run ad targeting or remarketing. The only data we collect is what you explicitly send us via the contact form, what our hosting provider logs for security, and the aggregated usage measurements captured by <strong className="text-fg">Google Analytics 4</strong> so we can see which pages people read.</p>
        </div>
      </div>
    </section>

    {/* ================== SECTION 2, DATA CONTROLLER ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <p className="tag">Data controller</p>
          <h2 className="display text-2xl md:text-3xl mt-4">Who is responsible</h2>
          <div className="accent-line mt-4"></div>
        </div>
        <div className="md:col-span-8">
          <address className="not-italic text-muted leading-relaxed">
            <strong className="text-fg text-lg block">2060 OÜ</strong>
            Ahtri tn 12, 10151 Tallinn, Estonia
          </address>
          <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4 mt-6 text-sm">
            <div><dt className="text-xs tracking-wider uppercase text-muted">Registry code</dt><dd className="text-fg mt-1">16853041 (Estonia)</dd></div>
            <div><dt className="text-xs tracking-wider uppercase text-muted">VAT</dt><dd className="text-fg mt-1">EE102810457</dd></div>
            <div><dt className="text-xs tracking-wider uppercase text-muted">Founded</dt><dd className="text-fg mt-1">2023</dd></div>
          </dl>
          <p className="text-sm text-muted mt-8"><strong className="text-fg">Contact for privacy matters.</strong> Use the <a href="/contact" className="prose-link text-fg">contact form</a> with inquiry type <em>General inquiry</em> and begin the message with <em>"Legal:"</em>. We do not publish a direct email for privacy requests; routing is handled internally.</p>
        </div>
      </div>
    </section>

    {/* ================== SECTION 3, WHAT WE COLLECT ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Data we collect</p>
        <h2 className="display text-2xl md:text-3xl mt-4 max-w-3xl">What We Collect and Why</h2>
        <div className="grid md:grid-cols-12 gap-10 mt-12">
          <div className="md:col-span-4">
            <h3 className="display text-lg">Contact form submissions</h3>
          </div>
          <div className="md:col-span-8 reading text-e5 space-y-5">
            <p>When you submit the form on <code>/contact</code>, we receive the fields you fill in:</p>
            <ul className="space-y-2 text-muted">
              <li><strong className="text-fg">Required.</strong> Inquiry type, name, email, message, consent checkbox.</li>
              <li><strong className="text-fg">Conditionally required.</strong> Organization (for investor, enterprise, or press inquiries).</li>
              <li><strong className="text-fg">Optional.</strong> Role or title, LinkedIn or website, referral source.</li>
            </ul>
            <p>We also receive automatically, as part of submission security:</p>
            <ul className="space-y-2 text-muted">
              <li><strong className="text-fg">IP address and user-agent string</strong>, from our hosting provider, used only for per-IP rate limiting and honeypot-based abuse detection. Not used for tracking or profiling.</li>
            </ul>
            <p className="text-muted italic text-sm">No third-party anti-bot, captcha, or browser-fingerprinting service is used on this form.</p>
            <p className="pt-2"><strong className="text-fg">Purpose.</strong> The sole purpose of this data is to reply to your inquiry and route it to the correct person on the team. We do not use it for marketing, profiling, or automated decision-making.</p>
            <p><strong className="text-fg">Legal basis.</strong> Your explicit consent, collected via the consent checkbox at submission (GDPR Article 6(1)(a)), and our legitimate interest in responding to inbound business inquiries (GDPR Article 6(1)(f)).</p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-10 mt-10 border-t hairline pt-10">
          <div className="md:col-span-4">
            <h3 className="display text-lg">Cookies and analytics</h3>
          </div>
          <div className="md:col-span-8 reading text-e5 space-y-5">
            <p className="text-muted"><strong className="text-fg">Google Analytics 4 (GA4).</strong> The site loads the GA4 tag (measurement ID <code>G-9H5406F02W</code>) to count pageviews and track navigation between pages. Two first-party cookies are set on your browser:</p>
            <ul className="space-y-2 text-muted">
              <li><code>_ga</code> &mdash; distinguishes unique browsers. Expires after 2 years.</li>
              <li><code>_ga_9H5406F02W</code> &mdash; persists session state for this specific GA4 property. Expires after 2 years.</li>
            </ul>
            <p className="text-muted">GA4 <strong className="text-fg">anonymizes IP addresses before storage</strong> by default, so no full IP is retained against your session. We use the <strong className="text-fg">standard GA4 configuration only</strong>: no Google Signals, no remarketing, no ad personalization, no Google Ads linkage, no user-ID joins across devices. The data we receive is aggregate (page popularity, referrer, rough geography, device class).</p>
            <p className="text-muted"><strong className="text-fg">No other cookies.</strong> The contact form's anti-abuse measures (honeypot, time-to-submit check, rate limit, disposable-email blocklist) are all server-side and set no cookies. No anti-bot cookies, no session cookies, no preference cookies beyond GA4.</p>
            <p className="text-muted"><strong className="text-fg">No ad networks. No cross-site trackers.</strong> GA4 is the only third-party tag on the site.</p>
            <p className="text-xs text-muted italic">If you would rather opt out of GA4 tracking on this site, browser-level "Do Not Track" and extensions like uBlock Origin or the official <a href="https://tools.google.com/dlpage/gaoptout" className="prose-link text-fg" rel="noopener">Google Analytics Opt-out Browser Add-on</a> will block the GA4 script entirely. We do not contest that choice and the site functions identically.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 4, WHERE DATA IS PROCESSED ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Processing location</p>
        <h2 className="display text-2xl md:text-3xl mt-4">Where Data Is Processed</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <article className="card">
            <h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-server text-fg" aria-hidden="true"></i>Site hosting</h3>
            <div className="accent-line mt-2 mb-4"></div>
            <p className="text-muted text-sm">The site is hosted by <strong className="text-fg">OVHcloud</strong> from its datacenter in <strong className="text-fg">Beauharnois, Québec, Canada</strong> ("BHS"). <strong className="text-fg">No CDN is used.</strong> Static assets are served directly from the OVHcloud datacenter, and request metadata (IP address, user-agent) is therefore logged in Canada only. Canada holds an <strong className="text-fg">adequacy decision from the European Commission</strong> (Commission Decision 2002/2/EC of 20 December 2001, applicable to commercial organisations subject to PIPEDA), which means transfers of personal data from the EEA to the OVHcloud Canada datacenter do not require Standard Contractual Clauses.</p>
          </article>
          <article className="card">
            <h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-envelope text-fg" aria-hidden="true"></i>Contact-form submissions</h3>
            <div className="accent-line mt-2 mb-4"></div>
            <p className="text-muted text-sm">Handled by an <strong className="text-fg">internal submission processor</strong>. The mechanism is <strong className="text-fg">not email-based</strong>; no email-sending provider (Resend, Postmark, Amazon SES, or equivalent) is used to route submissions, and no internal email alias is created or published. The exact submission-handling mechanism is to be specified during site implementation and will be listed on this page once finalized.</p>
          </article>
          <article className="card">
            <h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-shield-halved text-fg" aria-hidden="true"></i>Anti-bot protection</h3>
            <div className="accent-line mt-2 mb-4"></div>
            <p className="text-muted text-sm">Spam protection is <strong className="text-fg">fully self-hosted</strong> using server-side measures inside the OVHcloud Canada datacenter (honeypot field, time-to-submit check, per-IP rate limiting, disposable-email-domain blocklist). <strong className="text-fg">No third-party anti-bot service</strong> (Cloudflare Turnstile, hCaptcha, reCAPTCHA, or equivalent) is used; no spam-protection data leaves the hosting datacenter.</p>
          </article>
          <article className="card">
            <h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-chart-line text-fg" aria-hidden="true"></i>Google Analytics 4</h3>
            <div className="accent-line mt-2 mb-4"></div>
            <p className="text-muted text-sm">Aggregate site-usage measurements are processed by <strong className="text-fg">Google LLC</strong> (United States) and <strong className="text-fg">Google Ireland Limited</strong>, in the Google Analytics 4 infrastructure. Transfers from the EEA to the United States are covered by the <strong className="text-fg">EU-US Data Privacy Framework</strong> (Commission Implementing Decision (EU) 2023/1795 of 10 July 2023), for which Google LLC is a certified participant. IP addresses are <strong className="text-fg">anonymized before storage</strong>. No ad personalization, remarketing, or Google Signals is enabled.</p>
          </article>
          <article className="card">
            <h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-arrows-rotate text-fg" aria-hidden="true"></i>Future sub-processors</h3>
            <div className="accent-line mt-2 mb-4"></div>
            <p className="text-muted text-sm">If any future sub-processor is located in a country without an EC adequacy decision or DPF coverage, transfer will be governed by the European Commission's <strong className="text-fg">Standard Contractual Clauses (SCCs)</strong> and any supplementary safeguards required. An up-to-date list of sub-processors is maintained on this page.</p>
          </article>
        </div>
      </div>
    </section>

    {/* ================== SECTION 5, RETENTION ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Retention</p>
        <h2 className="display text-2xl md:text-3xl mt-4">How Long We Keep It</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="clean">
            <thead>
              <tr><th>Data category</th><th>Retention</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Contact-form submissions, <strong className="text-fg">active business correspondence</strong> (investor, enterprise, press, general)</td>
                <td>Up to <strong className="text-fg">24 months</strong> from the last interaction, then deleted or anonymized unless required for an ongoing engagement.</td>
              </tr>
              <tr>
                <td>Contact-form submissions, <strong className="text-fg">hiring inquiries, not proceeding</strong></td>
                <td>Up to <strong className="text-fg">6 months</strong> after the final reply, then deleted.</td>
              </tr>
              <tr>
                <td>Contact-form submissions, <strong className="text-fg">hiring inquiries, candidate in process</strong></td>
                <td>Until the role closes; retention then follows the above.</td>
              </tr>
              <tr>
                <td>Spam-protection logs (IP, user-agent)</td>
                <td>Up to <strong className="text-fg">30 days</strong>, then deleted.</td>
              </tr>
              <tr>
                <td>Submission-handler processing logs</td>
                <td>Per the handler's default policy, to be specified during implementation; targeted retention: <strong className="text-fg">&le; 30 days</strong>.</td>
              </tr>
              <tr>
                <td>Google Analytics 4 event and user-property data</td>
                <td><strong className="text-fg">2 months</strong> (the minimum GA4 retention setting). Aggregate reports derived from that data are kept indefinitely but contain no identifiers.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-8 max-w-3xl">No contact-form data is retained indefinitely. No data is sold or shared with third parties except the processors listed above.</p>
      </div>
    </section>

    {/* ================== SECTION 6, YOUR RIGHTS ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Your rights</p>
        <h2 className="display text-2xl md:text-3xl mt-4">What You Can Ask Us To Do</h2>
        <p className="text-muted mt-4 max-w-3xl reading">Under the GDPR, you have the right to:</p>
        <ul className="mt-8 grid md:grid-cols-2 gap-y-5 gap-x-10 max-w-5xl text-muted">
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-eye text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Access</strong> the personal data we hold about you.</span></li>
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-pen-to-square text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Rectify</strong> inaccurate data.</span></li>
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-trash text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Erase</strong> your data ("right to be forgotten") where we no longer have a lawful basis to keep it.</span></li>
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-ban text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Restrict</strong> or <strong className="text-fg">object</strong> to processing.</span></li>
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-download text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Portability</strong>: receive a machine-readable copy of the data you gave us.</span></li>
          <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-rotate-left text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Withdraw consent</strong> at any time, without affecting the lawfulness of prior processing.</span></li>
          <li className="flex items-start gap-3 md:col-span-2"><i className="fa-solid fa-fw fa-scale-balanced text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Lodge a complaint</strong> with a supervisory authority. Ours is the <strong className="text-fg">Estonian Data Protection Inspectorate</strong> (Andmekaitse Inspektsioon): <a href="https://www.aki.ee/en" className="prose-link text-fg" rel="noopener">aki.ee ↗</a>.</span></li>
        </ul>
        <p className="text-sm text-muted mt-10 max-w-3xl">To exercise any of these rights, use the <a href="/contact" className="prose-link text-fg">contact form</a> with inquiry type <em>General inquiry</em> and begin the message with <em>"Legal:"</em>. We respond within <strong className="text-fg">30 days</strong>.</p>
      </div>
    </section>

    {/* ================== SECTION 7, CHANGES ================== */}
    <section className="px-6 py-16 reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Changes</p>
        <h2 className="display text-2xl md:text-3xl mt-4 max-w-3xl">Changes to This Policy</h2>
        <div className="max-w-3xl reading text-e5 mt-8 space-y-5">
          <p>We update this page when our data practices change, for example when a processor is added or retention periods are revised. The <em>Last updated</em> date at the top reflects the most recent change.</p>
          <p>This policy has no retroactive effect; prior submissions remain governed by the version in force at the time they were sent, archived in the site's Git history.</p>
        </div>
      </div>
    </section>
    </>
  );
}
