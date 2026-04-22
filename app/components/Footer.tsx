import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t hairline">
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <span
            className="logo-2060 h-5 text-fg mb-4"
            role="img"
            aria-label="2060"
          ></span>
          <p className="text-muted mt-4">
            An independent research and engineering company. 2060 is a founding
            member of the{" "}
            <a
              href="https://verana.io"
              className="prose-link text-fg"
              rel="noopener"
            >
              Verana Foundation
            </a>{" "}
            and the developer of{" "}
            <a
              href="https://hologram.zone"
              className="prose-link text-fg"
              rel="noopener"
            >
              Hologram
            </a>
            .
          </p>
        </div>
        <div>
          <p className="tag mb-4">Projects</p>
          <ul className="space-y-2 text-muted">
            <li>
              <a
                href="https://hologram.zone"
                className="prose-link"
                rel="noopener"
              >
                Hologram ↗
              </a>
            </li>
            <li>
              <a href="https://verana.io" className="prose-link" rel="noopener">
                Verana ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/2060-io"
                className="prose-link"
                rel="noopener"
              >
                GitHub ↗
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="tag mb-4">Company</p>
          <ul className="space-y-2 text-muted">
            <li>
              <Link href="/" className="prose-link">
                Home
              </Link>
            </li>
            <li>
              <Link href="/projects" className="prose-link">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/team" className="prose-link">
                Team
              </Link>
            </li>
            <li>
              <Link href="/investors" className="prose-link">
                Investors
              </Link>
            </li>
            <li>
              <Link href="/contact" className="prose-link">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="tag mb-4">Resources</p>
          <ul className="space-y-2 text-muted">
            <li>
              <a
                href="https://verana-labs.github.io/verifiable-trust-spec/"
                className="prose-link"
                rel="noopener"
              >
                Verifiable Trust Spec ↗
              </a>
            </li>
            <li>
              <a
                href="https://verana-labs.github.io/verifiable-trust-vpr-spec/"
                className="prose-link"
                rel="noopener"
              >
                VPR Spec ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/2060-io/hologram-generic-ai-agent-vs/blob/main/docs/agent-pack-schema.md"
                className="prose-link"
                rel="noopener"
              >
                Agent Pack Schema ↗
              </a>
            </li>
          </ul>
          <p className="tag mt-8 mb-4">Social</p>
          <ul className="space-y-2 text-muted">
            <li>
              <a
                href="https://www.linkedin.com/company/2060-io/"
                className="prose-link"
                rel="noopener"
              >
                LinkedIn ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/2060-io"
                className="prose-link"
                rel="noopener"
              >
                GitHub ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <span>
            © 2026 2060 OÜ · Ahtri tn 12, 10151 Tallinn, Estonia · reg. 16853041
            · founded 2023
          </span>
          <ul className="flex gap-6">
            <li>
              <Link href="/privacy" className="prose-link">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="prose-link">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
