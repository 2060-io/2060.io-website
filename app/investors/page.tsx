export const metadata = {
  title: 'Investors — 2060',
};

export default function Page() {
  return (
    <>
{/* ================== SECTION 1, OPENING ================== */}
    <section className="px-6 pt-16 pb-20 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/viaduc2.svg" alt="" aria-hidden="true" className="hero-illustration mb-10" width="3072" height="1536" />
        <p className="tag tag-accent">Investors</p>
        <h1 className="display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mt-6 max-w-4xl">Invest in the Company Building the Agentic Trust Infrastructure</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-lg md:text-xl text-fg mt-8 max-w-3xl font-medium">The agentic economy is arriving. The trust layer underneath it does not exist yet. 2060 is the company that ships it.</p>
        <div className="max-w-3xl reading space-y-5 text-e5 mt-8">
          <p>AI agents are moving beyond assistance: searching, deciding, transacting, and interacting across services and organizations on behalf of the people and legal entities that own them. The owner remains liable for everything the agent does. At that point trust stops being a feature. <strong className="text-fg">It becomes infrastructure.</strong></p>
          <p>2060 builds that infrastructure. Our commercial product, <a href="https://hologram.zone" className="prose-link text-fg" rel="noopener">Hologram</a>, is in production today. The protocol underneath it, <a href="https://verana.io" className="prose-link text-fg" rel="noopener">Verana</a>, is a neutral public network we co-founded and help steward. The specifications the category is converging on were drafted in our office. This round capitalizes the next 18–24 months of the bet.</p>
          <p className="text-xs tracking-wider uppercase text-muted pt-2">Open source · Standards-based · Production today · Category-defining</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-10">
          <a href="https://www.linkedin.com/in/fabricerochette/" className="btn btn-primary" rel="noopener">Reach Fabrice on LinkedIn ↗</a>
          <a href="/contact?topic=investor" className="btn">Request Investor Memo</a>
          <a href="/contact?topic=investor" className="btn">Request Data Room</a>
        </div>

        {/* At a glance */}
        <div className="mt-16">
          <p className="text-xs tracking-wider uppercase text-muted mb-6">At a glance</p>
          <dl className="border-t hairline max-w-4xl">
            <div className="spec-row"><dt>Company</dt><dd>2060 OÜ, Tallinn, Estonia</dd></div>
            <div className="spec-row"><dt>Flagship product</dt><dd><a href="https://hologram.zone" className="prose-link" rel="noopener">Hologram</a>: deploy personal and corporate AI agents that are verifiable, compliant, governable, and multi-user</dd></div>
            <div className="spec-row"><dt>Protocol</dt><dd><a href="https://verana.io" className="prose-link" rel="noopener">Verana</a>: co-founder, Council member, largest code contributor</dd></div>
            <div className="spec-row"><dt>Standards</dt><dd>Verifiable Trust v4 · VPR v4 (co-authored, lead editor)</dd></div>
            <div className="spec-row"><dt>Stage</dt><dd>Production stack shipped and open-sourced · Hologram Cloud (managed SaaS) GA launching <strong className="text-fg">15 May 2026</strong> · commercial adoption begins at Cloud GA</dd></div>
            <div className="spec-row"><dt>Tech</dt><dd>Open source (Apache 2.0) · W3C VC / DIDComm / MCP / Verana</dd></div>
            <div className="spec-row"><dt>Geography</dt><dd>HQ Tallinn · team distributed across Europe, Asia, and the Americas</dd></div>
            <div className="spec-row"><dt>Investment target</dt><dd>Equity</dd></div>
            <div className="spec-row"><dt>Round details</dt><dd>Shared directly with qualified investors on request. <a href="/contact?topic=investor" className="prose-link">Talk to the founders →</a></dd></div>
          </dl>
        </div>
      </div>
    </section>

    {/* ================== SECTION 2, WHY NOW ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Why now</p>
            <h2 className="display text-3xl md:text-4xl mt-4">The Agentic Economy Is Here. The Trust Layer Is Not.</h2>
            <div className="accent-line mt-6"></div>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>The inflection has already happened. Major labs shipped agentic products. Gartner projects <strong className="text-fg">33% of enterprise applications</strong> will include agentic capabilities by 2028. McKinsey estimates <strong className="text-fg">$2.6T–$4.4T</strong> of annual global value.</p>
            <p>Regulation is compounding pressure: EU AI Act, eIDAS 2.0, US AI executive orders, sectoral rules in finance and healthcare. The requirement is identical across all of them: <strong className="text-fg">AI agents must be identifiable, auditable, and accountable.</strong></p>
            <p>The infrastructure those agents need is still missing. Identity is unclear. Authority is implicit. Governance is fragmented. Agents operate in isolation. This is not a product gap. It is a <strong className="text-fg">category gap</strong>, and that is the opening 2060 exists to fill.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 3, OPPORTUNITY ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="tag">Opportunity</p>
          <h2 className="display text-3xl md:text-4xl mt-4">A Category-Defining Market</h2>
          <p className="text-muted mt-4 reading">The trust layer for AI agents sits at the intersection of three large, growing markets.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <article className="card"><p className="text-xs tracking-wider uppercase text-muted">Identity &amp; Access Management</p><h3 className="display text-2xl mt-2">$25B+</h3><p className="text-muted text-sm mt-2">today, ~14% CAGR. Incumbents (Okta, Auth0, Ping, Microsoft Entra) were built for humans clicking buttons, not autonomous agents.</p></article>
          <article className="card"><p className="text-xs tracking-wider uppercase text-muted">AI &amp; agentic infrastructure</p><h3 className="display text-2xl mt-2">$150B+</h3><p className="text-muted text-sm mt-2">projected by 2028. Frameworks exist. Trust plumbing does not.</p></article>
          <article className="card"><p className="text-xs tracking-wider uppercase text-muted">Compliance, governance, audit</p><h3 className="display text-2xl mt-2">$50B+</h3><p className="text-muted text-sm mt-2">accelerating under AI regulation.</p></article>
        </div>
        <div className="reading mt-10 text-e5 space-y-4 max-w-3xl">
          <p>2060 does not compete with incumbents in any one of these. We define the <strong className="text-fg">agent-native trust layer</strong> underneath all of them: the way TLS sits underneath the web, or OAuth sits underneath the modern API economy.</p>
          <p className="text-fg"><strong>If verifiable AI becomes the default, and regulation is pushing it there, the winner of this category owns a generational position.</strong></p>
        </div>
      </div>
    </section>

    {/* ================== SECTION 4, OUR POSITION ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Our position</p>
        <h2 className="display text-3xl md:text-4xl mt-4">What 2060 Owns, Contributes To, and Earns From</h2>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <article className="card"><h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-building-shield text-fg" aria-hidden="true"></i>What 2060 owns</h3><div className="accent-line mt-2 mb-4"></div><ul className="space-y-2 text-muted text-sm"><li>The <strong className="text-fg">Hologram</strong> product line (App, VS Agent, Generic AI Agent, SDK, MCP catalog, Hologram Cloud), customer contracts, brand, IP.</li><li>2060's balance sheet, cap table, and commercial revenue.</li></ul></article>
          <article className="card"><h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-handshake text-fg" aria-hidden="true"></i>What 2060 contributes to</h3><div className="accent-line mt-2 mb-4"></div><ul className="space-y-2 text-muted text-sm"><li>The <strong className="text-fg">Verifiable Trust</strong> and <strong className="text-fg">VPR</strong> specifications: open, stewarded by the Verana Foundation.</li><li>The <strong className="text-fg">Verana Trust Network</strong>: neutral protocol governed by a Council of 15+ members. 2060 holds one seat.</li><li>The <strong className="text-fg">VNA token</strong>: issued by the Verana Foundation / OpCo in a separate legal vehicle. Not part of the 2060 equity raise.</li></ul></article>
          <article className="card"><h3 className="display text-lg flex items-center gap-2"><i className="fa-solid fa-fw fa-coins text-fg" aria-hidden="true"></i>What 2060 earns</h3><div className="accent-line mt-2 mb-4"></div><ul className="space-y-2 text-muted text-sm"><li><strong className="text-fg">Direct product revenue</strong> from Hologram SaaS, enterprise hosting, white-label.</li><li><strong className="text-fg">Protocol-level revenue from Verana:</strong> VUA rewards (Hologram is the dominant VUA); validator rewards; trust-deposit yield; Ecosystem-as-a-Service.</li><li><strong className="text-fg">Strategic distribution.</strong> Every enterprise adopting Verana is a warm audience for Hologram.</li></ul></article>
        </div>

        <div className="mt-12 max-w-3xl reading text-e5">
          <p className="text-xs tracking-wider uppercase text-muted">Why this structure beats owning the protocol</p>
          <p className="mt-3"><strong className="text-fg">Neutrality is the product.</strong> Enterprises, regulators, and competing ecosystems adopt Verana because no single company controls it. A 15+ member Council, one-member-one-vote, is what makes Verana investable as critical trust infrastructure. If 2060 owned Verana, Verana would not be adopted, and our best distribution channel would disappear.</p>
        </div>

        <div className="mt-12">
          <p className="text-xs tracking-wider uppercase text-muted">Key risk factors</p>
          <ul className="mt-4 space-y-3 text-muted max-w-3xl reading">
            <li><strong className="text-fg">Verana governance.</strong> One of 15+ votes; cannot unilaterally direct protocol. Mitigation: soft power through authorship; products also work against alternative trust protocols.</li>
            <li><strong className="text-fg">Mainnet timing.</strong> Slippage delays protocol revenue. Hologram SaaS is independent of mainnet.</li>
            <li><strong className="text-fg">Fork risk.</strong> Products are protocol-compatible, not protocol-exclusive.</li>
          </ul>
        </div>
      </div>
    </section>

    {/* ================== SECTION 5, TRACTION ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Traction</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Production Stack Shipped. Cloud GA Next.</h2>
        <p className="text-muted mt-4 max-w-3xl reading">Technology is shipped and open-sourced. Commercial adoption begins with <strong className="text-fg">Hologram Cloud</strong> GA, scheduled for <strong className="text-fg">15 May 2026</strong>. Until then, running a Hologram agent requires a developer team to deploy from GitHub, which is why the self-hosted footprint today is small by design.</p>

        <div className="grid md:grid-cols-2 gap-10 mt-12">
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">Shipped today</p>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">6+ components in production</strong> (Apache 2.0): Hologram App, VS Agent, Generic AI Agent, SDK, MCP catalog.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">5 reference agents live</strong>: Avatar, Gov ID, GitHub, Wise, X.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram App</strong> on App Store, Google Play, Huawei AppGallery.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Verifiable Trust v4</strong> and <strong className="text-fg">VPR v4</strong> specifications published.</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">Pre-cloud adoption (today)</p>
            <p className="text-muted text-sm leading-relaxed">Small and deliberate by design. Self-hosting a Hologram agent from GitHub today requires an engineering team, which both limits who runs one and is precisely the gate Cloud GA removes. Pre-cloud adoption metrics (self-hosted organizations, GitHub stars, Discord community, external contributors, active pilots and letters of intent) are published alongside commercial metrics at <strong className="text-fg">Hologram Cloud GA on 15 May 2026</strong>.</p>
          </div>
        </div>

        <div className="mt-14 border-l-2 border-accent pl-6 py-3 max-w-3xl">
          <p className="text-xs tracking-wider uppercase text-accent-hover">Hologram Cloud GA: 15 May 2026 (the inflection)</p>
          <ul className="mt-3 space-y-2 text-muted text-sm">
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-rocket text-fg mt-1" aria-hidden="true"></i><span><strong className="text-fg">Design-partner tenants</strong> live at launch.</span></li>
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-rocket text-fg mt-1" aria-hidden="true"></i><span><strong className="text-fg">Consumer Pro ($TBD/month)</strong> and <strong className="text-fg">enterprise managed hosting</strong> live day one.</span></li>
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-rocket text-fg mt-1" aria-hidden="true"></i><span>This is where ARR, paying Pro subscribers, and enterprise ACV begin.</span></li>
          </ul>
        </div>

        <p className="text-sm text-muted mt-10 max-w-3xl"><strong className="text-fg">Verana (protocol context, not 2060 revenue):</strong> Testnet live. Council forming toward its target of 15+ independent member organizations. Mainnet on the Foundation's roadmap. Protocol-level metrics are tracked and published by the Verana Foundation, not 2060.</p>
      </div>
    </section>

    {/* ================== SECTION 6, MOAT ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Moat</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Why This Position Becomes Defensible</h2>
        <p className="text-muted mt-4 reading max-w-3xl">Open standards are not the moat. 2060's <strong className="text-fg">position</strong> relative to those standards is.</p>
        <ul className="grid md:grid-cols-2 gap-y-6 gap-x-12 mt-12 max-w-5xl">
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-flag text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">First-mover category definition.</strong><span className="text-muted">Reference implementations of new standards tend to win the category (Stripe, Auth0, HashiCorp).</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-diagram-project text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Asymmetric network exposure through Verana.</strong><span className="text-muted">Hologram App is the dominant VUA; we hold the largest trust deposits; we operate validators with 5+ years of protocol experience.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-layer-group text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Top-to-bottom expertise, not top-to-bottom ownership.</strong><span className="text-muted">We authored the spec, co-founded the Foundation, run the reference implementation, operate validators. We do not own the protocol, by design, which is <em>why</em> enterprises trust it.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-gavel text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Regulatory lock-in.</strong><span className="text-muted">Installed base on open standards compounds defensibility as regulation formalizes verifiability.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-code-branch text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Open-source distribution.</strong><span className="text-muted">Apache 2.0. Adoption happens bottom-up, not through procurement cycles.</span></div></li>
        </ul>
        <p className="text-fg mt-12 max-w-3xl reading"><strong>We do not compete with LangChain, CrewAI, or Copilot Studio on orchestration. We are the trust layer underneath all of them.</strong></p>
      </div>
    </section>

    {/* ================== SECTION 7, BUSINESS MODEL ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Business model</p>
        <h2 className="display text-3xl md:text-4xl mt-4">Open Core. Three Revenue Motions.</h2>
        <p className="text-muted mt-4 reading max-w-3xl italic">All revenue flows into 2060 OÜ.</p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-muted">1. Consumer</p>
            <h3 className="display text-lg mt-2">Free → Pro</h3>
            <ul className="mt-4 space-y-2 text-muted text-sm">
              <li><strong className="text-fg">Free:</strong> 1 agent, messaging, wallet, basic LLM.</li>
              <li><strong className="text-fg">Pro $9/month:</strong> up to 5 agents, any LLM, unlimited MCP, RAG, custom domain.</li>
              <li>Low CAC via bottom-up adoption.</li>
            </ul>
          </article>
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-accent-hover">2. Enterprise</p>
            <h3 className="display text-lg mt-2">Primary revenue engine</h3>
            <ul className="mt-4 space-y-2 text-muted text-sm">
              <li>Hologram Cloud managed hosting · custom trust-registry setup · enterprise RBAC · IAM integration · white-label · SLAs.</li>
              <li>ACV targets and live pipeline detail are shared with qualified investors via the <a href="/contact?topic=investor" className="prose-link text-fg">Investors form</a>.</li>
            </ul>
          </article>
          <article className="card">
            <p className="text-xs tracking-wider uppercase text-muted">3. Protocol</p>
            <h3 className="display text-lg mt-2">Verana participation</h3>
            <p className="text-muted text-sm mt-3 italic">Scales with network activity, not 2060 sales effort.</p>
            <ul className="mt-4 space-y-2 text-muted text-sm">
              <li>VUA rewards · validator rewards · trust-deposit yield · Ecosystem-as-a-Service engagements.</li>
            </ul>
          </article>
        </div>
        <p className="text-xs text-muted mt-10 max-w-3xl italic">This is the open-core SaaS + protocol-participation shape of Coinbase on Ethereum, Databricks on Spark, Confluent on Kafka, adapted to the agentic trust layer.</p>
      </div>
    </section>

    {/* ================== SECTION 8, THE ROUND ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">The round</p>
        <h2 className="display text-3xl md:text-4xl mt-4">What 2060 Is Raising and Why</h2>
        <div className="max-w-3xl reading space-y-5 text-e5 mt-8">
          <p><strong className="text-fg">Round structure.</strong> Equity round into 2060 OÜ (Estonia).</p>
          <p className="text-fg"><strong>Round details (raise amount, valuation range, lead status, and committed capital) are shared directly with qualified investors.</strong> To discuss, use the <a href="/contact?topic=investor" className="prose-link text-fg">Investors form</a> or reach <a href="https://www.linkedin.com/in/fabricerochette/" className="prose-link text-fg" rel="noopener">Fabrice Rochette (CEO) on LinkedIn</a> directly.</p>
        </div>

        <div className="mt-12">
          <p className="text-xs tracking-wider uppercase text-muted">Use of funds (all inside 2060 OÜ)</p>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div className="card"><p className="display text-3xl text-fg">45%</p><p className="text-xs tracking-wider uppercase text-muted mt-1">Engineering</p><p className="text-muted text-sm mt-2">Hologram App, VS Agent, Generic AI Agent, SDK, MCP catalog, Hologram Cloud.</p></div>
            <div className="card"><p className="display text-3xl text-fg">30%</p><p className="text-xs tracking-wider uppercase text-muted mt-1">Go-to-market</p><p className="text-muted text-sm mt-2">Enterprise sales, dev rel, ecosystem partnerships.</p></div>
            <div className="card"><p className="display text-3xl text-fg">15%</p><p className="text-xs tracking-wider uppercase text-muted mt-1">Operations &amp; runway</p><p className="text-muted text-sm mt-2">&nbsp;</p></div>
            <div className="card"><p className="display text-3xl text-fg">10%</p><p className="text-xs tracking-wider uppercase text-muted mt-1">Validator / deposits</p><p className="text-muted text-sm mt-2">2060-operated Verana validators and 2060-held trust deposits on balance sheet. Protocol <em>participation</em> by 2060, not funding for the Foundation.</p></div>
          </div>
        </div>

        <aside className="mt-10 border-l-2 border-accent pl-6 py-3 max-w-3xl" role="note">
          <p className="text-xs tracking-wider uppercase text-accent-hover">Note to investors</p>
          <p className="text-e5 text-sm mt-2">Verana Foundation operations (mainnet, network grants, standards work) are funded separately by the Foundation's treasury and a forthcoming token raise via the Verana Foundation / OpCo. <strong className="text-fg">Your equity dollars stay inside 2060 OÜ.</strong> No commingling.</p>
        </aside>

        <div className="mt-14 grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">12-month milestones (2060-owned)</p>
            <ul className="space-y-3 text-muted text-sm">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram Cloud</strong> GA shipped in month 1 (<strong className="text-fg">15 May 2026</strong>).</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">150+ companies</strong> on Hologram Cloud by month 12.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">10,000+ Personal AI agents</strong> on the Hologram App by month 12.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">ARR target</strong> by month 12 (specific figure shared with qualified investors).</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span>Key integration shipped (Microsoft Entra, Okta, Google Cloud, AWS Marketplace).</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-circle-check text-muted mt-1" aria-hidden="true"></i><span>Regulatory milestone (EU AI Act alignment, eIDAS 2.0, SOC 2 Type II).</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wider uppercase text-muted mb-4">12-month milestones (ecosystem context)</p>
            <p className="text-xs text-muted mb-4 italic">Influenced by 2060 but not solely controlled.</p>
            <ul className="space-y-3 text-muted text-sm">
              <li className="flex items-start gap-3"><i className="fa-regular fa-fw fa-circle text-muted mt-1" aria-hidden="true"></i><span>Verana mainnet launch (led by the Council; 2060 is one of 15+).</span></li>
              <li className="flex items-start gap-3"><i className="fa-regular fa-fw fa-circle text-muted mt-1" aria-hidden="true"></i><span>First production trust registries on Verana.</span></li>
              <li className="flex items-start gap-3"><i className="fa-regular fa-fw fa-circle text-muted mt-1" aria-hidden="true"></i><span>Standards adoption signals (EU AI Act reference, eIDAS 2.0 references).</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-14">
          <p className="text-xs tracking-wider uppercase text-muted mb-4">Why now for 2060</p>
          <ul className="grid md:grid-cols-2 gap-y-4 gap-x-10 max-w-5xl text-muted">
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-bolt text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Cloud GA imminent.</strong> Hologram Cloud launches on <strong className="text-fg">15 May 2026</strong>: the stack moves from developer-deploy to managed SaaS. Investor dollars compound a live commercial surface that is weeks away.</span></li>
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-box-open text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Production stack shipped.</strong> Technology risk behind us.</span></li>
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-wind text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Regulatory tailwind accelerating.</strong></span></li>
            <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-bullseye text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Category forming now.</strong> Reference position is available for the next 12–24 months.</span></li>
            <li className="flex items-start gap-3 md:col-span-2"><i className="fa-solid fa-fw fa-scale-balanced text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Clean capital stack.</strong> EU operating company, standard equity. Token economics live in a separate entity.</span></li>
          </ul>
        </div>
      </div>
    </section>

    {/* ================== SECTION 9, TEAM SNAPSHOT ================== */}
    <section className="px-6 py-16 border-b hairline reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Team snapshot</p>
        <h2 className="display text-3xl md:text-4xl mt-4">The People You Are Investing In</h2>
        <ul className="grid md:grid-cols-2 gap-y-6 gap-x-12 mt-12 max-w-5xl text-muted">
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-pen-nib text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Spec authors.</strong><span>Lead editor of the Verifiable Trust and VPR specifications.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-seedling text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Protocol founders.</strong><span>Co-founders of the Verana Foundation; Council seat holders.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-rocket text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Product operators.</strong><span>Shipped the Hologram stack to App Store, Google Play, AppGallery.</span></div></li>
          <li className="flex items-start gap-4"><i className="fa-solid fa-fw fa-users text-xl text-muted mt-1" aria-hidden="true"></i><div><strong className="text-fg block">Senior team.</strong><span><strong className="text-fg">7 people</strong> across product and engineering, distributed across Europe, the Americas, and Asia. Spec authors, protocol operators, and open-source maintainers on every major shipped component.</span></div></li>
        </ul>
        <p className="text-sm text-muted mt-10">Full founder bios, advisor list, and ecosystem seats on the <a href="/team" className="prose-link text-fg">Team page</a>.</p>
      </div>
    </section>

    {/* ================== SECTION 10, CONNECT ================== */}
    <section className="px-6 py-16 reveal">
      <div className="max-w-6xl mx-auto">
        <p className="tag">Connect</p>
        <h2 className="display text-3xl md:text-5xl mt-4 max-w-3xl">Talk to 2060</h2>
        <div className="accent-line mt-6"></div>

        <ul className="mt-10 space-y-4 text-muted max-w-3xl">
          <li><strong className="text-fg">Investor inquiries:</strong> <a href="https://www.linkedin.com/in/fabricerochette/" className="prose-link text-fg" rel="noopener">Reach Fabrice on LinkedIn ↗</a> · <a href="/contact?topic=investor" className="prose-link text-fg">Contact form</a></li>
          <li><strong className="text-fg">Enterprise and partnerships:</strong> <a href="/contact?topic=enterprise" className="prose-link text-fg">Contact form</a></li>
          <li><strong className="text-fg">Press:</strong> <a href="/contact?topic=press" className="prose-link text-fg">Contact form</a></li>
          <li><strong className="text-fg">Hiring:</strong> <a href="/contact?topic=hiring" className="prose-link text-fg">Contact form</a></li>
          <li><strong className="text-fg">LinkedIn:</strong> <a href="https://www.linkedin.com/in/fabricerochette/" className="prose-link text-fg" rel="noopener">Fabrice Rochette (CEO) ↗</a> · <a href="https://www.linkedin.com/in/aogentile/" className="prose-link text-fg" rel="noopener">Ariel Gentile (CTO) ↗</a></li>
        </ul>

        <div className="flex flex-wrap gap-3 mt-10">
          <a href="https://www.linkedin.com/in/fabricerochette/" className="btn btn-primary" rel="noopener">Reach Fabrice on LinkedIn ↗</a>
          <a href="/contact?topic=investor" className="btn">Request Investor Memo</a>
          <a href="/contact?topic=investor" className="btn">Request Data Room</a>
        </div>
      </div>
    </section>

    {/* ================== SECTION, CLOSING ILLUSTRATION ================== */}
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/blueprint.svg" alt="" aria-hidden="true" className="hero-illustration" width="3072" height="1536" />
      </div>
    </section>
    </>
  );
}
