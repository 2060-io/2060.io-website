export const metadata = {
  title: 'Projects — 2060',
};

export default function Page() {
  return (
    <>
{/* ================== SECTION 1, OVERVIEW ================== */}
    <section className="px-6 pt-16 pb-12 border-b hairline">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/projects.svg" alt="" aria-hidden="true" className="hero-illustration mb-10" width="3072" height="1536" />
        <p className="tag">Projects</p>
        <h1 className="display text-4xl md:text-5xl mt-4 max-w-3xl">What We Build</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-muted mt-8 reading max-w-2xl">Three projects carry the weight of our work. Each solves a different layer of the same problem: making trust verifiable for humans, services, and AI agents.</p>
        <ul className="mt-10 grid md:grid-cols-3 gap-4 text-sm">
          <li><a href="#hologram" className="prose-link text-fg"><strong>Hologram</strong>: commercial product line (AI agent trust infrastructure).</a></li>
          <li><a href="#verana" className="prose-link text-fg"><strong>Verana</strong>: open protocol (trust registries and verifiable governance).</a></li>
          <li><a href="#specifications" className="prose-link text-fg"><strong>Specifications</strong>: open standards (Verifiable Trust and VPR).</a></li>
        </ul>
        <p className="text-xs text-muted mt-10 italic max-w-2xl">A fourth dimension runs across all three: <strong className="text-fg">open-source engineering</strong>, our long-standing practice of shipping production-grade code as the primary artifact of every project.</p>
      </div>
    </section>

    {/* ================== SECTION 2, HOLOGRAM ================== */}
    <section id="hologram" className="px-6 py-16 border-b hairline reveal scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag tag-accent">Flagship product</p>
            <h2 className="display text-3xl md:text-4xl mt-4 flex items-center gap-3">
              <img src="/assets/hologram-logo.svg" alt="" className="card-logo w-8 h-8 flex-shrink-0 rounded-md" width="32" height="32" aria-hidden="true" />
              Hologram
            </h2>
            <p className="text-muted mt-4">Verifiable AI Agents in Production.</p>
            <div className="accent-line mt-6"></div>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              Hologram is our commercial product line. It is the verifiable trust layer for AI agents: a production stack that allows agents to identify themselves, operate under verifiable authority, prove their delegation rights, and interact safely across a trusted ecosystem.
            </p>
            <p className="text-muted text-xs tracking-wider uppercase pt-4">The stack</p>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-mobile-screen text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram Messaging App.</strong> Verifiable User Agent for iOS, Android, and Huawei. Private messaging, credential wallet, Proof-of-Trust resolution.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-robot text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">VS Agent.</strong> DIDComm agent framework with credential management and DID lifecycle.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-brain text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Generic AI Agent.</strong> Modular LLM agent with MCP, RAG, RBAC, and approval workflows. LLM-agnostic, cloud-agnostic.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-cube text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram SDK</strong> and <strong className="text-fg">Agent Pack schema</strong> for developers building custom Verifiable Services.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-plug text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram MCP catalog</strong>: reusable MCP servers (Wise, GitHub, X, growing).</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-cloud text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Hologram Cloud</strong>: enterprise hosting, RBAC, SLAs, IAM integration, white-label. GA <strong className="text-fg">15 May 2026</strong>.</span></li>
            </ul>
            <p className="text-xs text-muted italic pt-2">Open source (Apache 2.0). Built on W3C Verifiable Credentials, DIDComm, MCP, and the Verana Trust Network.</p>
            <div className="pt-4 flex flex-wrap gap-3">
              <a href="https://hologram.zone" className="btn btn-primary" rel="noopener">Explore Hologram ↗</a>
              <a href="https://hologram.zone/demos" className="btn" rel="noopener">Live Demos ↗</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 3, VERANA ================== */}
    <section id="verana" className="px-6 py-16 border-b hairline reveal scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Neutral protocol</p>
            <h2 className="display text-3xl md:text-4xl mt-4 flex items-center gap-3">
              <img src="/assets/verana-logo.svg" alt="" className="card-logo w-8 h-8 flex-shrink-0" width="32" height="32" aria-hidden="true" />
              Verana
            </h2>
            <p className="text-muted mt-4">The protocol we co-founded.</p>
            <div className="accent-line mt-6"></div>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              Verana is a neutral, decentralized Layer-1 protocol for trust registries, credential schemas, and verifiable governance. It is <strong className="text-fg">not</strong> a 2060 product. It is stewarded by the <strong className="text-fg">Verana Foundation</strong> and governed by a <strong className="text-fg">Council of independent member organizations</strong> across sectors and jurisdictions, each holding one vote.
            </p>
            <p className="text-muted text-xs tracking-wider uppercase pt-4">2060's role in Verana</p>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-star text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Founding member and Council seat.</strong></span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-code-branch text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Largest single code contributor</strong> to the reference implementation.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-pen-nib text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Lead editor</strong> of the Verifiable Trust and VPR specifications.</span></li>
              <li className="flex items-start gap-3"><i className="fa-solid fa-fw fa-server text-muted mt-1" aria-hidden="true"></i><span><strong className="text-fg">Validator operator</strong> on the Verana Trust Network.</span></li>
            </ul>
            <p>
              This relationship is deliberate and transparent. Verana is neutral infrastructure, <em>not</em> a 2060-owned protocol. Its neutrality is what makes it adoptable by enterprises, regulators, and competing ecosystems. 2060 benefits by building the leading commercial implementation on top.
            </p>
            <div className="pt-4">
              <a href="https://verana.io" className="btn btn-primary" rel="noopener">Explore Verana ↗</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 4, SPECIFICATIONS ================== */}
    <section id="specifications" className="px-6 py-16 border-b hairline reveal scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="tag">Open specifications</p>
            <h2 className="display text-3xl md:text-4xl mt-4">The Open Specifications We Author</h2>
            <div className="accent-line mt-6"></div>
          </div>
          <div className="md:col-span-8 reading space-y-5 text-e5">
            <p>
              The specifications that define the Verifiable Trust category. Public, openly licensed, maintained through the Verana Foundation's editorial process with 2060 as lead editor.
            </p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <a href="https://github.com/verana-labs/verifiable-trust-spec" className="card flex flex-col h-full text-fg" rel="noopener">
                <span className="display text-xs tracking-wider uppercase text-muted">Specification</span>
                <h3 className="display text-xl mt-3">Verifiable Trust v4</h3>
                <p className="text-muted text-sm mt-2 flex-1">Normative spec for Verifiable Services, Verifiable User Agents, and trust resolution.</p>
                <span className="prose-link text-fg text-sm mt-4 self-end">GitHub ↗</span>
              </a>
              <a href="https://github.com/verana-labs/verifiable-trust-vpr-spec" className="card flex flex-col h-full text-fg" rel="noopener">
                <span className="display text-xs tracking-wider uppercase text-muted">Specification</span>
                <h3 className="display text-xl mt-3">VPR v4</h3>
                <p className="text-muted text-sm mt-2 flex-1">Normative spec for the Verana protocol: data model, query API, permissions, tokenomics, validation.</p>
                <span className="prose-link text-fg text-sm mt-4 self-end">GitHub ↗</span>
              </a>
            </div>
            <p className="text-xs text-muted italic pt-2">Both specifications are prerequisites for any Verana-compatible implementation, whether 2060's Hologram stack or a third-party build.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ================== SECTION 5, OPEN-SOURCE PORTFOLIO ================== */}
    <section className="px-6 py-16 reveal">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="tag">Open source</p>
          <h2 className="display text-3xl md:text-4xl mt-4">What We Ship in Public</h2>
          <p className="text-muted mt-4 reading">Everything we build is open source under Apache 2.0 unless explicitly stated otherwise.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <a href="https://github.com/2060-io" className="card flex flex-col h-full text-fg" rel="noopener">
            <span className="display text-xs tracking-wider uppercase text-muted">GitHub</span>
            <h3 className="display text-xl mt-3 flex items-center gap-3">
              <i className="fa-brands fa-fw fa-github text-2xl" aria-hidden="true"></i>
              github.com/2060-io
            </h3>
            <p className="text-muted text-sm mt-3 flex-1">2060's commercial and experimental projects, including the Hologram stack, VS Agent, Generic AI Agent, SDK, and MCP catalog.</p>
            <span className="prose-link text-fg text-sm mt-4 self-end">Browse ↗</span>
          </a>
          <a href="https://github.com/verana-labs" className="card flex flex-col h-full text-fg" rel="noopener">
            <span className="display text-xs tracking-wider uppercase text-muted">GitHub</span>
            <h3 className="display text-xl mt-3 flex items-center gap-3">
              <i className="fa-brands fa-fw fa-github text-2xl" aria-hidden="true"></i>
              github.com/verana-labs
            </h3>
            <p className="text-muted text-sm mt-3 flex-1">The Verana protocol reference implementation, chain modules, and Verifiable Trust and VPR specifications.</p>
            <span className="prose-link text-fg text-sm mt-4 self-end">Browse ↗</span>
          </a>
        </div>
      </div>
    </section>

    {/* ================== SECTION, CLOSING ILLUSTRATION ================== */}
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <img src="/assets/projects-bottom2.svg" alt="" aria-hidden="true" className="hero-illustration" width="2688" height="1536" />
      </div>
    </section>
    </>
  );
}
