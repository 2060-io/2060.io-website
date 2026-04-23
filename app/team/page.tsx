export const metadata = {
  title: 'Team — 2060',
};

export default function Page() {
  return (
    <>
{/* ================== SECTION 1, OVERVIEW ================== */}
    <section className="px-6 pt-16 pb-12 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/home.svg" alt="" aria-hidden="true" className="hero-illustration mb-10" width="3072" height="1116" />
        <p className="tag">Team</p>
        <h1 className="display text-4xl md:text-5xl mt-4 max-w-3xl">The People Building This</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-muted mt-8 reading max-w-2xl">We are spec authors, protocol maintainers, and product operators who work together because the problem is large and the window is narrow. This page is the honest introduction.</p>
      </div>
    </section>

    {/* ================== SECTION 2, ORIGIN ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Origin</p>
            <h2 className="display text-3xl md:text-4xl mt-4">A Ten-Year Bet, Made Public in 2024</h2>
            <div className="accent-line mt-6"></div>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              The work that became 2060 started at the <a href="https://internetidentityworkshop.com/" className="prose-link text-fg" rel="noopener">Internet Identity Workshop</a>. Over successive IIW sessions, the team developed the thesis that would become <strong className="text-fg">Verifiable Trust</strong>: that identity, authority, and accountability for services and AI agents should be resolvable in real time against neutral, public registries, not negotiated bilaterally per integration.
            </p>
            <p className="text-muted text-xs tracking-wider uppercase pt-2">That thesis produced</p>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-file-lines text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Specifications.</strong> The Verifiable Trust and VPR specifications, drafted between 2021 and 2024, now at v4.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-network-wired text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">A protocol.</strong> Verana, whose reference implementation 2060 seeded and whose Foundation 2060 co-founded in 2024.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-rocket text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">A product line.</strong> Hologram, our commercial stack, in market since 2025 and now on the App Store, Google Play, and Huawei AppGallery.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-people-group text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">An ecosystem.</strong> A Council of 15+ independent organizations across sectors and jurisdictions, each with one vote on the protocol's direction.</span></li>
            </ul>
            <p className="pt-2 italic">2060 does not own the ecosystem. 2060 invented the category it sits in.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 3, FOUNDERS ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Founders</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Founders</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <article className="card flex flex-col h-full">
            <div className="flex items-start gap-5">
              <span className="avatar"><img src="/assets/illustrations/fabrice.jpeg" alt="Fabrice Rochette portrait" width="64" height="64" /></span>
              <div className="flex-1">
                <h3 className="display text-xl">Fabrice Rochette</h3>
                <p className="text-xs tracking-wider uppercase text-accent-hover mt-1">Co-founder &amp; CEO</p>
              </div>
            </div>
            <p className="text-muted text-sm mt-5 flex-1">Entrepreneur and visionary technologist. Co-inventor of Verifiable Trust. Principal author of the Verana specifications. Lead of product and ecosystem strategy. Also Co-founder and CEO of the Verana Foundation.</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <a href="https://www.linkedin.com/in/fabricerochette/" className="prose-link text-fg" rel="noopener">LinkedIn ↗</a>
              <a href="https://x.com/fabricerochette" className="prose-link text-fg" rel="noopener">X ↗</a>
              <a href="https://github.com/mjfelis" className="prose-link text-fg" rel="noopener">GitHub ↗</a>
            </div>
          </article>
          <article className="card flex flex-col h-full">
            <div className="flex items-start gap-5">
              <span className="avatar"><img src="/assets/illustrations/ariel.jpeg" alt="Ariel Gentile portrait" width="64" height="64" /></span>
              <div className="flex-1">
                <h3 className="display text-xl">Ariel Gentile</h3>
                <p className="text-xs tracking-wider uppercase text-accent-hover mt-1">Co-founder &amp; CTO</p>
              </div>
            </div>
            <p className="text-muted text-sm mt-5 flex-1">Electronic engineer and open-source leader. Maintainer of VS Agent and the Hologram App. Long-time contributor to Credo-TS. Co-founder and CTO of the Verana Foundation.</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <a href="https://www.linkedin.com/in/aogentile/" className="prose-link text-fg" rel="noopener">LinkedIn ↗</a>
              <a href="https://github.com/genaris" className="prose-link text-fg" rel="noopener">GitHub ↗</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    {/* ================== SECTION 4, CORE TEAM ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Core team</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Core Team</h2>
        <div className="max-w-3xl mt-6 reading text-muted">
          <p>Beyond the founders, 2060's core team is <strong className="text-fg">5 people</strong> across product and engineering, distributed across <strong className="text-fg">Europe, the Americas, and Asia</strong>. Every engineer on the core team has shipped production code on at least one of our three tracks: the Hologram stack, the Verana reference implementation, or the Verifiable Trust / VPR specifications.</p>
          <p className="mt-4 italic">We hire rarely. When we do, we hire on craft.</p>
        </div>

        <h3 className="display text-xl mt-12">Product</h3>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <article className="card flex items-start gap-5">
            <span className="avatar"><img src="/assets/gerard.jpeg" alt="Gerard William Burion portrait" width="64" height="64" /></span>
            <div className="flex-1">
              <h4 className="display text-lg">Gerard William Burion</h4>
              <p className="text-xs tracking-wider uppercase text-accent-hover mt-1">Chief Product Officer</p>
              <p className="text-muted text-sm mt-3">25+ years across mobile, media, payments, and fintech in the Paris tech ecosystem (including Treezor, Europe's banking-as-a-service platform). Owns product direction for the Hologram stack and the path to Hologram Cloud GA.</p>
              <a href="https://www.linkedin.com/in/gerard-william-burion/" className="prose-link text-fg text-sm mt-3 inline-block" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
        </div>

        <h3 className="display text-xl mt-12">Engineering</h3>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <article className="card flex items-start gap-5">
            <span className="avatar"><img src="/assets/pratik.jpeg" alt="Pratik Kumar portrait" width="64" height="64" /></span>
            <div className="flex-1">
              <h4 className="display text-lg">Pratik Kumar</h4>
              <p className="text-xs tracking-wider uppercase text-muted mt-1">Senior Blockchain Developer</p>
              <p className="text-muted text-sm mt-3">Lead contributor on the Verana chain (Cosmos SDK / Go): permissioning modules, fee and trust-deposit logic, TypeScript client harness.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <a href="https://www.linkedin.com/in/pratik-kumar-/" className="prose-link text-fg" rel="noopener">LinkedIn ↗</a>
                <a href="https://github.com/pratikasr" className="prose-link text-fg" rel="noopener">@pratikasr ↗</a>
              </div>
            </div>
          </article>
          <article className="card flex items-start gap-5">
            <span className="avatar"><img src="/assets/tarun.jpeg" alt="Tarun Vadde portrait" width="64" height="64" /></span>
            <div className="flex-1">
              <h4 className="display text-lg">Tarun Vadde</h4>
              <p className="text-xs tracking-wider uppercase text-muted mt-1">Software Developer</p>
              <p className="text-muted text-sm mt-3">Self-sovereign-identity specialist. TypeScript, NestJS, Solidity, Hyperledger Aries / Indy. Works on VS Agent, credential-handling flows, and the Hologram App's verifiable-credential wallet.</p>
              <a href="https://www.linkedin.com/in/tarunvadde/" className="prose-link text-fg text-sm mt-3 inline-block" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
          <article className="card flex items-start gap-5">
            <span className="avatar"><img src="/assets/andres.jpeg" alt="Andrés Felipe Vallecilla Puentes portrait" width="64" height="64" /></span>
            <div className="flex-1">
              <h4 className="display text-lg">Andrés Felipe Vallecilla Puentes</h4>
              <p className="text-xs tracking-wider uppercase text-muted mt-1">Full-Stack Developer</p>
              <p className="text-muted text-sm mt-3">Full-stack engineer contributing across the Hologram stack and Verana reference implementations. Based in Bogotá.</p>
              <a href="https://www.linkedin.com/in/andres-felipe-vallecilla-puentes/" className="prose-link text-fg text-sm mt-3 inline-block" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
          <article className="card flex items-start gap-5">
            <span className="avatar"><img src="/assets/maxime.jpeg" alt="Maxime Mansiet portrait" width="64" height="64" /></span>
            <div className="flex-1">
              <h4 className="display text-lg">Maxime Mansiet</h4>
              <p className="text-xs tracking-wider uppercase text-muted mt-1">Software Developer</p>
              <p className="text-muted text-sm mt-3">Contributor on the Hologram stack.</p>
              <a href="https://www.linkedin.com/in/maxime-mansiet/" className="prose-link text-fg text-sm mt-3 inline-block" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    {/* ================== SECTION 5, ADVISORS ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Advisors</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Advisors</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <article className="card flex flex-col h-full">
            <div className="flex items-start gap-5">
              <span className="avatar"><img src="/assets/philip.jpeg" alt="Philip A. Bildner portrait" width="64" height="64" /></span>
              <div className="flex-1">
                <h3 className="display text-xl">Philip A. Bildner</h3>
                <p className="text-xs tracking-wider uppercase text-accent-hover mt-1">Strategic Advisor</p>
              </div>
            </div>
            <p className="text-muted text-sm mt-5 flex-1">10+ years across law, compliance, tax, audit, and finance in the blockchain and sports sectors. Prior roles at <strong className="text-fg">Pantera Capital</strong>, <strong className="text-fg">Proskauer Rose LLP</strong>, and the <strong className="text-fg">NFL</strong>. Currently strategy-and-operations at Autonomous; advises Caribbean high-net-worth capital on blockchain and U.S. real-estate investments. Member of the State Bar of California. Harvard JD; UC Berkeley BA (summa cum laude).</p>
            <div className="mt-5">
              <a href="https://www.linkedin.com/in/pbildner/" className="prose-link text-fg text-sm" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
          <article className="card flex flex-col h-full">
            <div className="flex items-start gap-5">
              <span className="avatar"><img src="/assets/david.jpeg" alt="David Rennie portrait" width="64" height="64" /></span>
              <div className="flex-1">
                <h3 className="display text-xl">David Rennie</h3>
                <p className="text-xs tracking-wider uppercase text-accent-hover mt-1">Strategic Advisor</p>
              </div>
            </div>
            <p className="text-muted text-sm mt-5 flex-1">London-based digital-identity and payments specialist with 18+ years of work on UK identity infrastructure. Individual Expert Member at the <a href="https://digitalpoundfoundation.com/" className="prose-link text-fg" rel="noopener">Digital Pound Foundation</a>, leading its Privacy and Identity Working Group. Prior work across the UK Identity Card Programme, the James Crosby review of identity assurance, the Privacy and Consumer Advisory Group, the Open Identity Exchange, and GOV.UK Verify. Currently advising at Westwick Melrose &amp; Cromwell (WMC), a London family-office advisory.</p>
            <div className="mt-5">
              <a href="https://www.linkedin.com/in/david-rennie-b736541/" className="prose-link text-fg text-sm" rel="noopener">LinkedIn ↗</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    {/* ================== SECTION 6, ECOSYSTEM SEATS ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Ecosystem</p>
            <h2 className="display text-3xl md:text-4xl mt-4">Where We Sit in the Ecosystem</h2>
            <div className="accent-line mt-6"></div>
            <p className="text-muted text-sm mt-6 italic">These seats are not promotional. They reflect where our people do the technical work.</p>
          </div>
          <div className="md:col-span-8 reading">
            <ul className="space-y-4 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-star text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Verana Foundation</strong>: founding member, Council seat (one of 15+), validator operator, lead editor of the Verifiable Trust and VPR specifications.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-wallet text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">OpenWallet Foundation</strong>: active contributor on Credo-ts and wallet interoperability.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-shield-halved text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Trust Over IP (ToIP)</strong>: participant in governance and trust-registry working groups.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-id-card text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Decentralized Identity Foundation (DIF)</strong>: contributor on DID methods and credential formats.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-microphone text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Internet Identity Workshop (IIW)</strong>: regular presenters and session conveners since 2020.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 7, VALUES ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Values</p>
        <h2 className="display text-3xl md:text-4xl mt-4">How We Work</h2>
        <dl className="grid md:grid-cols-2 gap-y-8 gap-x-12 mt-12 max-w-5xl">
          <div>
            <dt className="display text-lg flex items-center gap-3"><i className="fa-solid fa-fw fa-book-open text-xl text-fg" aria-hidden="true"></i>Open by default</dt>
            <dd className="text-muted mt-2">Code, specs, governance. If it can be public, it is.</dd>
          </div>
          <div>
            <dt className="display text-lg flex items-center gap-3"><i className="fa-solid fa-fw fa-scale-balanced text-xl text-fg" aria-hidden="true"></i>Neutral where it matters</dt>
            <dd className="text-muted mt-2">We author standards. We contribute to foundations. We do not privatize the commons our work depends on.</dd>
          </div>
          <div>
            <dt className="display text-lg flex items-center gap-3"><i className="fa-solid fa-fw fa-hourglass-half text-xl text-fg" aria-hidden="true"></i>Long-term over loud</dt>
            <dd className="text-muted mt-2">Ten-year bets, not twelve-month cycles.</dd>
          </div>
          <div>
            <dt className="display text-lg flex items-center gap-3"><i className="fa-solid fa-fw fa-hammer text-xl text-fg" aria-hidden="true"></i>Craft over headcount</dt>
            <dd className="text-muted mt-2">We hire for depth, not scale.</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="display text-lg flex items-center gap-3"><i className="fa-solid fa-fw fa-list-ol text-xl text-fg" aria-hidden="true"></i>Standards-led, product-proven</dt>
            <dd className="text-muted mt-2">Specifications first. Reference implementations next. Commercial products last. In that order, on purpose.</dd>
          </div>
        </dl>
      </div>
    </section>

    {/* ================== SECTION 8, HIRING ================== */}
    <section className="px-6 py-16 reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-8">
            <p className="tag">Hiring</p>
            <h2 className="display text-3xl md:text-4xl mt-4">Send Work, Not Résumés</h2>
            <p className="text-muted mt-6 reading">We hire rarely and slowly. If you are a protocol engineer, cryptographer, standards editor, or full-stack developer with a track record of shipping open-source code in identity or agentic AI, we would rather hear from you than not.</p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <a href="/contact?topic=hiring" className="btn btn-primary">Get in Touch →</a>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION, CLOSING ILLUSTRATION ================== */}
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/musiciens.svg" alt="" aria-hidden="true" className="hero-illustration" width="3072" height="1536" />
      </div>
    </section>
    </>
  );
}
