/*
  Structured data for rich search results.
  Scoped to the home page so Google de-duplicates the graph rather
  than seeing it repeated on every inner page.
*/
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://2060.io/#organization",
      "name": "2060",
      "legalName": "2060 OÜ",
      "url": "https://2060.io",
      "logo": {
        "@type": "ImageObject",
        "url": "https://2060.io/assets/logo-2060.svg",
      },
      "foundingDate": "2023",
      "foundingLocation": {
        "@type": "Place",
        "name": "Tallinn, Estonia",
      },
      "description":
        "Independent research and engineering company building the infrastructure for a verifiable internet.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ahtri tn 12",
        "postalCode": "10151",
        "addressLocality": "Tallinn",
        "addressCountry": "EE",
      },
      "sameAs": [
        "https://github.com/2060-io",
        "https://www.linkedin.com/company/2060-io/",
      ],
      "memberOf": {
        "@type": "Organization",
        "name": "Verana Foundation",
        "url": "https://verana.io",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://2060.io/#website",
      "url": "https://2060.io",
      "name": "2060",
      "publisher": { "@id": "https://2060.io/#organization" },
      "inLanguage": "en",
    },
    {
      "@type": "SoftwareApplication",
      "name": "Hologram Agentic AI",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Cross-platform",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "url": "https://hologram.zone",
      "downloadUrl": "https://github.com/2060-io",
      "creator": { "@id": "https://2060.io/#organization" },
      "description":
        "Open infrastructure for deploying decentralized, verifiable, identifiable, and governable AI agents. Built by 2060 on the Verana trust layer.",
    },
    {
      "@type": "TechArticle",
      "headline": "Verifiable Trust Specification",
      "url": "https://verana-labs.github.io/verifiable-trust-spec/",
      "author": { "@id": "https://2060.io/#organization" },
      "about": [
        "Verifiable Credentials",
        "Trust Registry",
        "Decentralized Identity",
        "Digital Trust Ecosystem",
      ],
    },
    {
      "@type": "TechArticle",
      "headline": "Verifiable Public Registry Specification",
      "url": "https://verana-labs.github.io/verifiable-trust-vpr-spec/",
      "author": { "@id": "https://2060.io/#organization" },
      "about": [
        "Verifiable Public Registry",
        "Decentralized Identity",
        "Digital Trust Ecosystem",
      ],
    },
    {
      "@type": "Person",
      "name": "Fabrice Rochette",
      "jobTitle": "Co-founder and CEO",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/illustrations/fabrice.jpeg",
      "sameAs": [
        "https://www.linkedin.com/in/fabricerochette/",
        "https://x.com/fabricerochette",
      ],
    },
    {
      "@type": "Person",
      "name": "Ariel Gentile",
      "jobTitle": "Co-founder and CTO",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/illustrations/ariel.jpeg",
      "sameAs": [
        "https://www.linkedin.com/in/aogentile/",
        "https://github.com/genaris",
      ],
    },
    {
      "@type": "Person",
      "name": "Gerard William Burion",
      "jobTitle": "Chief Product Officer",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "sameAs": ["https://www.linkedin.com/in/gerard-william-burion/"],
    },
    {
      "@type": "Person",
      "name": "Pratik Kumar",
      "jobTitle": "Senior Blockchain Developer",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/pratik.jpeg",
      "sameAs": [
        "https://www.linkedin.com/in/pratik-kumar-/",
        "https://github.com/pratikasr",
      ],
    },
    {
      "@type": "Person",
      "name": "Tarun Vadde",
      "jobTitle": "Software Developer",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/tarun.jpeg",
      "sameAs": ["https://www.linkedin.com/in/tarunvadde/"],
    },
    {
      "@type": "Person",
      "name": "Andrés Felipe Vallecilla Puentes",
      "jobTitle": "Full-Stack Developer",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/andres.jpeg",
      "sameAs": [
        "https://www.linkedin.com/in/andres-felipe-vallecilla-puentes/",
      ],
    },
    {
      "@type": "Person",
      "name": "Maxime Mansiet",
      "jobTitle": "Software Developer",
      "worksFor": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/maxime.jpeg",
      "sameAs": ["https://www.linkedin.com/in/maxime-mansiet/"],
    },
    {
      "@type": "Person",
      "name": "Philip A. Bildner",
      "jobTitle": "Strategic Advisor",
      "affiliation": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/philip.jpeg",
      "sameAs": ["https://www.linkedin.com/in/pbildner/"],
    },
    {
      "@type": "Person",
      "name": "David Rennie",
      "jobTitle": "Strategic Advisor",
      "affiliation": { "@id": "https://2060.io/#organization" },
      "image": "https://2060.io/assets/david.jpeg",
      "sameAs": ["https://www.linkedin.com/in/david-rennie-b736541/"],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
{/* ================== SECTION 1, HERO ================== */}
    <section className="px-6 pt-12 md:pt-16 pb-20 md:pb-28 border-b hairline">
      <div className="max-w-6xl mx-auto text-center">
        <img src="/assets/team.svg" alt="" aria-hidden="true" className="hero-illustration mb-10" width="3072" height="1536" />
        <p className="text-xs text-muted tracking-wide uppercase">
          Open Source · Founding Member of the Verana Foundation · Production Stack in Market
        </p>
        <h1 className="display text-4xl md:text-6xl lg:text-7xl leading-[1.05] max-w-5xl mx-auto mt-6">
          We Build the Open Trust Layer for the Agentic Internet
        </h1>
        <div className="accent-line mx-auto mt-6"></div>
        <p className="text-lg md:text-xl text-muted reading max-w-2xl mx-auto mt-8">
          An independent research and engineering company inventing, specifying, and shipping the infrastructure that lets humans, services, and AI agents prove who they are, and act under verifiable authority.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <a href="/team" className="btn btn-primary">Meet the Team</a>
          <a href="/investors" className="btn">Talk to Investors</a>
        </div>
      </div>
    </section>

    {/* ================== SECTION 2, WHO WE ARE ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Who we are</p>
            <h2 className="display text-3xl md:text-4xl mt-4">Independent. Technical. Long-Term.</h2>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              2060 is a senior team distributed across Europe, Asia, and the Americas. We are the people who, over years of work at the <a href="https://internetidentityworkshop.com/" className="prose-link text-fg" rel="noopener">Internet Identity Workshop</a>, invented the concept of <strong className="text-fg">Verifiable Trust</strong>, then wrote the specifications, seeded the reference implementations, and co-founded the <a href="https://verana.io" className="prose-link text-fg" rel="noopener">Verana Foundation</a> to steward the work as a public good.
            </p>
            <p>
              We do not sell a platform, and we do not sell hours. We build products, contribute to open protocols, and operate the decentralized networks those protocols depend on. Our revenue comes from <strong className="text-fg">Hologram</strong>, the commercial product line built on top of everything we've authored.
            </p>
            <p>
              When you work with 2060, you work directly with spec authors, protocol maintainers, and product operators. Not a sales team.
            </p>
          </div>
        </div>

        {/* Timeline illustration */}
        <ol className="mt-16 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm relative" aria-label="Timeline">
          <div className="hidden md:block absolute top-2.5 left-4 right-4 h-px hairline border-t"></div>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-muted mb-3"></span><strong className="block text-fg">2020</strong><span className="text-muted">Verifiable Trust invented at IIW</span></li>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-muted mb-3"></span><strong className="block text-fg">2021–22</strong><span className="text-muted">First Hologram PoCs</span></li>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-muted mb-3"></span><strong className="block text-fg">2023</strong><span className="text-muted">Verana VPR development</span></li>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-muted mb-3"></span><strong className="block text-fg">2024</strong><span className="text-muted">Verana Foundation co-founded</span></li>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-muted mb-3"></span><strong className="block text-fg">2025</strong><span className="text-muted">Hologram in market · Verana Testnet</span></li>
          <li className="relative"><span className="block w-2 h-2 rounded-full bg-accent mb-3"></span><strong className="block text-fg">2026</strong><span className="text-muted">Hologram Cloud GA, 15 May</span></li>
        </ol>

        <img src="/assets/long-term.svg" alt="" aria-hidden="true" className="hero-illustration mt-16" width="3072" height="1536" />
      </div>
    </section>

    {/* ================== SECTION 3, WHAT WE BUILD ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="tag">What we build</p>
          <h2 className="display text-3xl md:text-4xl mt-4">Three Bets. One Trust Layer.</h2>
          <p className="text-muted mt-4 reading">A commercial product, a neutral protocol we co-founded, and the open specifications that define the category. Each reinforces the other two.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <article className="card flex flex-col h-full">
            <span className="display text-xs tracking-wider uppercase text-accent-hover">Flagship product</span>
            <h3 className="display text-2xl mt-3 flex items-center gap-3">
              <img src="/assets/hologram-logo.svg" alt="" className="card-logo w-8 h-8 flex-shrink-0 rounded-md" width="32" height="32" aria-hidden="true" />
              Hologram
            </h3>
            <p className="text-muted mt-3 flex-1">Our commercial product line: the verifiable trust layer for AI agents, in production today. Messaging app on iOS, Android, and Huawei; agent framework; SDK; enterprise cloud launching 15 May 2026.</p>
            <a href="https://hologram.zone" className="prose-link text-fg text-sm mt-5 self-end" rel="noopener">Explore Hologram ↗</a>
          </article>
          <article className="card flex flex-col h-full">
            <span className="display text-xs tracking-wider uppercase text-muted">Neutral protocol</span>
            <h3 className="display text-2xl mt-3 flex items-center gap-3">
              <img src="/assets/verana-logo.svg" alt="" className="card-logo w-8 h-8 flex-shrink-0" width="32" height="32" aria-hidden="true" />
              Verana
            </h3>
            <p className="text-muted mt-3 flex-1">Open, decentralized infrastructure for trust registries and verifiable governance, stewarded by the Verana Foundation Council. 2060 co-founded it, holds a Council seat, and is the largest single code contributor.</p>
            <a href="https://verana.io" className="prose-link text-fg text-sm mt-5 self-end" rel="noopener">Explore Verana ↗</a>
          </article>
          <article className="card flex flex-col h-full">
            <span className="display text-xs tracking-wider uppercase text-muted">Open specifications</span>
            <h3 className="display text-2xl mt-3 flex items-center gap-3">
              <i className="fa-solid fa-fw fa-file-lines text-2xl card-icon" aria-hidden="true"></i>
              Verifiable Trust &amp; VPR
            </h3>
            <p className="text-muted mt-3 flex-1">The open specifications that define the category. Verifiable Trust v4 and VPR v4: co-authored by 2060, maintained publicly, adopted by the Council. Apache 2.0.</p>
            <a href="/projects#specifications" className="prose-link text-fg text-sm mt-5 self-end">Read the specs →</a>
          </article>
        </div>
      </div>
    </section>

    {/* ================== SECTION 4, WHY NOW ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Why now</p>
            <h2 className="display text-3xl md:text-4xl mt-4">The Agentic Economy Is Here. The Trust Layer Is Not.</h2>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              The inflection has already happened. Major labs have shipped agentic products (OpenAI Operator, Anthropic Computer Use and MCP, Google Project Mariner, Microsoft Copilot Studio). Gartner projects <strong className="text-fg">33% of enterprise applications</strong> will include agentic AI capabilities by 2028. McKinsey estimates agentic AI will add <strong className="text-fg">$2.6T–$4.4T</strong> of annual global value.
            </p>
            <p>
              Regulation is compounding the pressure. The EU AI Act, eIDAS 2.0, US executive orders on AI safety, and sectoral rules in financial services and healthcare all point to the same requirement: <strong className="text-fg">AI agents must be identifiable, auditable, and accountable.</strong>
            </p>
            <p className="text-muted">At the same time, the infrastructure those agents need to operate safely at scale is still missing:</p>
            <ul className="space-y-2 text-muted">
              <li><strong className="text-fg">Identity is unclear.</strong> Most agents cannot prove who they are or who operates them.</li>
              <li><strong className="text-fg">Authority is implicit.</strong> Delegation rights are assumed, not verified.</li>
              <li><strong className="text-fg">Governance is fragmented.</strong> There is no shared framework for accountability.</li>
              <li><strong className="text-fg">Agents operate in isolation.</strong> Interoperability is a promise, not a reality.</li>
            </ul>
            <p>
              This is not a product gap. It is a <strong className="text-fg">category gap.</strong> The agentic economy needs a trust layer, and none has been built at scale. That is the opening 2060 exists to fill.
            </p>
          </div>
        </div>

        <img src="/assets/train.svg" alt="" aria-hidden="true" className="hero-illustration mt-16" width="3072" height="1536" />
      </div>
    </section>

    {/* ================== SECTION 5, TRACTION AT A GLANCE ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="tag">Traction at a glance</p>
          <h2 className="display text-3xl md:text-4xl mt-4">Proof, Not Promises.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mt-12">
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">What's live today</p>
            <ul className="space-y-4 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Production stack shipped</strong>: 6+ open-source components (Apache 2.0) including Hologram App, VS Agent, Generic AI Agent, SDK, and MCP catalog.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram Messaging App</strong> live on App Store, Google Play, and Huawei AppGallery.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">5 reference agents</strong> accessible today: Avatar, Gov ID, GitHub, Wise, X.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Verana Trust Network</strong> testnet operational; mainnet on the Foundation's roadmap.</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">Standards &amp; ecosystem</p>
            <ul className="space-y-4 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span>Founding member and Council seat: <strong className="text-fg">Verana Foundation</strong>.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span>Active contributors: <strong className="text-fg">OpenWallet Foundation · Trust Over IP · Decentralized Identity Foundation</strong>.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span>Speakers and maintainers at the <strong className="text-fg">Internet Identity Workshop</strong>.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Verifiable Trust v4</strong> and <strong className="text-fg">VPR v4</strong> specifications: public, open, maintained.</span></li>
            </ul>
          </div>
        </div>

        <aside className="mt-14 border-l-2 border-accent pl-6 py-3 max-w-3xl" role="note">
          <p className="text-xs tracking-wider uppercase text-muted">Measured adoption</p>
          <p className="text-e5 mt-2">Adoption metrics (Hologram Cloud tenants, Personal AI agents, network activity, open-source traction) are published alongside commercial launch at <strong className="text-fg">Hologram Cloud GA on 15 May 2026</strong>.</p>
        </aside>

        <img src="/assets/tools.svg" alt="" aria-hidden="true" className="hero-illustration mt-16" width="3072" height="1536" />
      </div>
    </section>

    {/* ================== SECTION 6, STANDARDS & ECOSYSTEM ================== */}
    <section className="standards-section px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Standards</p>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mt-4 lg:items-start">
          <div>
            <h2 className="display text-3xl md:text-4xl">The Standards We Author. The Venues We Show Up In.</h2>
            <p className="text-muted mt-4 reading">2060 does not operate a walled garden. We contribute to and help steward the open ecosystem our work depends on. Every component we ship is built on open, interoperable standards, and we are active participants in the bodies that maintain them.</p>
            <p className="text-xs text-muted mt-8 italic">Interoperable by design. No vendor lock-in. Ever.</p>
          </div>
          <ul className="logo-strip" aria-label="Standards bodies, foundations, and implementations we work with">
            <li><a href="https://www.w3.org/"          target="_blank" rel="noopener noreferrer" title="W3C"><img className="logo-img" src="/assets/logos/logo-w3c.svg"            alt="W3C" /></a></li>
            <li><a href="https://didcomm.org/"         target="_blank" rel="noopener noreferrer" title="DIDComm"><img className="logo-img" src="/assets/logos/logo-didcomm.svg"        alt="DIDComm" /></a></li>
            <li><a href="https://identity.foundation/" target="_blank" rel="noopener noreferrer" title="Decentralized Identity Foundation"><img className="logo-img" src="/assets/logos/logo-dif.png"            alt="Decentralized Identity Foundation" /></a></li>
            <li><a href="https://trustoverip.org/"     target="_blank" rel="noopener noreferrer" title="Trust over IP Foundation"><img className="logo-img" src="/assets/logos/logo-trust-over-ip.svg"  alt="Trust over IP Foundation" /></a></li>
            <li><a href="https://openwallet.foundation/" target="_blank" rel="noopener noreferrer" title="OpenWallet Foundation"><img className="logo-img" src="/assets/logos/logo-open-wallet.svg"    alt="OpenWallet Foundation" /></a></li>
            <li><a href="https://credo.js.org/"        target="_blank" rel="noopener noreferrer" title="Credo"><img className="logo-img" src="/assets/logos/logo-credo.svg"          alt="Credo" /></a></li>
            <li><a href="https://daiaa.org/"           target="_blank" rel="noopener noreferrer" title="DAIAA"><img className="logo-img" src="/assets/logos/daiaa.avif"              alt="DAIAA" /></a></li>
            <li><a href="https://cosmos.network/"      target="_blank" rel="noopener noreferrer" title="Cosmos"><img className="logo-img logo-wide" src="/assets/logos/cosmos-logo-black.svg" alt="Cosmos" /></a></li>
          </ul>
        </div>
      </div>
    </section>

    {/* ================== SECTION 7, FINAL CTA ================== */}
    <section className="px-6 py-20 reveal">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="display text-3xl md:text-5xl max-w-3xl mx-auto leading-tight">
          Two Ways to Engage With 2060
        </h2>
        <div className="accent-line mx-auto mt-6"></div>
        <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-accent-hover">Investor</p>
            <h3 className="display text-lg mt-3">Talk about the current round</h3>
            <p className="text-muted mt-3 text-sm">Start with the Investors page or reach Fabrice Rochette (CEO) directly on LinkedIn. Round financials are shared one-to-one, not on the public site.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/investors" className="btn">Investors →</a>
              <a href="https://www.linkedin.com/in/fabricerochette/" className="btn" rel="noopener">Reach Fabrice ↗</a>
            </div>
          </article>
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-muted">Enterprise / consortium</p>
            <h3 className="display text-lg mt-3">Evaluate Hologram</h3>
            <p className="text-muted mt-3 text-sm">Our commercial product line. Verifiable AI agents on Apache 2.0 foundations, with enterprise managed hosting launching 15 May 2026.</p>
            <div className="mt-5">
              <a href="https://hologram.zone" className="btn" rel="noopener">Hologram ↗</a>
            </div>
          </article>
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-muted">Council / protocol</p>
            <h3 className="display text-lg mt-3">Build on Verana</h3>
            <p className="text-muted mt-3 text-sm">Neutral public infrastructure for trust registries and verifiable governance. Council seats, validator ops, and ecosystem onboarding.</p>
            <div className="mt-5">
              <a href="https://verana.io" className="btn" rel="noopener">Verana ↗</a>
            </div>
          </article>
        </div>

        <img src="/assets/two-chairs.svg" alt="" aria-hidden="true" className="hero-illustration mt-16" width="3072" height="1536" />
      </div>
    </section>
    </>
  );
}
