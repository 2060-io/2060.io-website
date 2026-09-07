/**
 * Renders legal-document markdown (the NDA) to semantic HTML for on-screen
 * review. Ported from veranafoundation.org's agreement-html. Mirrors the
 * construct set understood by the PDF renderer — H1/H2/H3, inline **bold**,
 * paragraphs, `---` rules, pipe tables — but as flowing, themeable HTML.
 *
 * The output is built from escaped text, so signer-supplied values cannot
 * inject markup. Wrap it in a `.doc-prose` container (globals.css).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Undo markdown backslash-escapes, then HTML-escape, then apply **bold**. */
function inline(s: string): string {
  const unescaped = s.replace(/\\([!-/:-@[-`{-~])/g, "$1");
  let out = "";
  let bold = false;
  for (const part of unescaped.split("**")) {
    if (part) out += bold ? `<strong>${escapeHtml(part)}</strong>` : escapeHtml(part);
    bold = !bold;
  }
  return out;
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isTableSeparator(line: string): boolean {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line);
}
function cells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (line.trim() === "") continue;
    if (/^#{1,}\s*$/.test(line)) continue; // bare heading markers ("# ")

    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trimEnd())) {
        if (!isTableSeparator(lines[i].trimEnd())) rows.push(cells(lines[i].trimEnd()));
        i++;
      }
      i--;
      const [head, ...body] = rows;
      html.push("<table>");
      if (head) html.push(`<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`);
      html.push("<tbody>");
      for (const r of body) html.push(`<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
      html.push("</tbody></table>");
      continue;
    }

    if (line.trim() === "---") { html.push("<hr />"); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const tag = `h${h[1].length}`;
      html.push(`<${tag}>${inline(h[2])}</${tag}>`);
      continue;
    }

    html.push(`<p>${inline(line)}</p>`);
  }

  return html.join("\n");
}

/**
 * Render a template "uncustomized" for the admin preview: placeholders are kept
 * literal (e.g. {{org_name}}) but the <!--IF/ELSE/ENDIF--> markers are stripped
 * so both branches show and the comments don't leak as text.
 */
export function renderTemplateHtml(template: string): string {
  const stripped = template.replace(/<!--(?:IF:\w+|ELSE|ENDIF)-->/g, "");
  return markdownToHtml(stripped);
}
