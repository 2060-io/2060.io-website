import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

/**
 * Renders legal-document markdown (the NDA) to a PDF using pdf-lib and the
 * standard Helvetica fonts — no headless browser, no font files to ship, so it
 * runs unchanged on the node:22-alpine standalone runtime. Ported from
 * veranafoundation.org's agreement-pdf.
 *
 * It is a focused renderer, not a general markdown engine: it understands only
 * the constructs the documents actually use — H1/H2/H3, inline **bold**,
 * paragraphs, `---` rules, GitHub pipe tables. Word-wrapping, page breaks and
 * footer page numbers are handled.
 */

const PAGE = { w: 595.28, h: 841.89 }; // A4 in points
const MARGIN = 56;
const CONTENT_W = PAGE.w - MARGIN * 2;
const INK = rgb(0.1, 0.1, 0.1);
const RULE = rgb(0.7, 0.7, 0.7);

const SIZE = { h1: 15, h2: 13, h3: 11, body: 9.5, foot: 8 };
const LEAD = { h1: 21, h2: 18, h3: 15, body: 13 }; // line height per style

type Style = "h1" | "h2" | "h3" | "body";
type Run = { text: string; bold: boolean };

// WinAnsi (Helvetica) can't encode every glyph; map the ones we emit and
// downgrade anything else outside Latin-1 so a stray character never throws.
const GLYPHS: Record<string, string> = { "☒": "[X]", "☐": "[ ]", "✓": "[X]" };
const KEEP = new Set("“”‘’—–…€•§™©°");
function sanitize(s: string): string {
  // Undo markdown backslash-escapes (\_ \[ \] \. …) so they don't render literally.
  s = s.replace(/\\([!-/:-@[-`{-~])/g, "$1");
  let out = "";
  for (const ch of s) {
    if (GLYPHS[ch]) { out += GLYPHS[ch]; continue; }
    const cp = ch.codePointAt(0)!;
    if (cp <= 0x7e || (cp >= 0xa0 && cp <= 0xff) || KEEP.has(ch)) out += ch;
    else out += "?";
  }
  return out;
}

/** Split a markdown line into bold / non-bold runs on `**` toggles. */
function toRuns(line: string): Run[] {
  const runs: Run[] = [];
  let bold = false;
  for (const part of line.split("**")) {
    if (part) runs.push({ text: sanitize(part), bold });
    bold = !bold;
  }
  return runs.length ? runs : [{ text: "", bold: false }];
}

class Layout {
  private page!: PDFPage;
  private y = 0;
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly pdf: PDFDocument,
    private readonly reg: PDFFont,
    private readonly bold: PDFFont,
  ) {
    this.newPage();
  }

  private newPage() {
    this.page = this.pdf.addPage([PAGE.w, PAGE.h]);
    this.pages.push(this.page);
    this.y = PAGE.h - MARGIN;
  }

  private ensure(space: number) {
    if (this.y - space < MARGIN) this.newPage();
  }

  gap(h: number) {
    this.y -= h;
    if (this.y < MARGIN) this.newPage();
  }

  private font(bold: boolean) {
    return bold ? this.bold : this.reg;
  }

  private wrap(runs: Run[], size: number, maxW: number): Run[][] {
    const lines: Run[][] = [];
    let cur: Run[] = [];
    let curW = 0;
    const spaceW = this.reg.widthOfTextAtSize(" ", size);
    for (const run of runs) {
      const words = run.text.split(/(\s+)/).filter((w) => w !== "");
      for (const word of words) {
        if (/^\s+$/.test(word)) {
          if (cur.length) { cur.push({ text: " ", bold: run.bold }); curW += spaceW; }
          continue;
        }
        const w = this.font(run.bold).widthOfTextAtSize(word, size);
        if (curW + w > maxW && cur.length) {
          lines.push(cur);
          cur = [];
          curW = 0;
        }
        cur.push({ text: word, bold: run.bold });
        curW += w;
      }
    }
    if (cur.length) lines.push(cur);
    return lines.length ? lines : [[]];
  }

  /** Draw wrapped, possibly-bold text at the given style. */
  paragraph(runs: Run[], style: Style, x = MARGIN, maxW = CONTENT_W) {
    const size = SIZE[style];
    const lead = style === "body" ? LEAD.body : LEAD[style];
    for (const line of this.wrap(runs, size, maxW)) {
      this.ensure(lead);
      this.y -= size;
      let cx = x;
      for (const run of line) {
        if (run.text === " ") { cx += this.reg.widthOfTextAtSize(" ", size); continue; }
        const f = this.font(run.bold);
        this.page.drawText(run.text, { x: cx, y: this.y, size, font: f, color: INK });
        cx += f.widthOfTextAtSize(run.text, size);
      }
      this.y -= lead - size;
    }
  }

  rule() {
    this.ensure(LEAD.body);
    this.y -= LEAD.body / 2;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.w - MARGIN, y: this.y },
      thickness: 0.5,
      color: RULE,
    });
    this.y -= LEAD.body / 2;
  }

  /** Two-column table (header row bold). Rows are pre-split cell arrays. */
  table(rows: string[][]) {
    const size = SIZE.body;
    const padX = 6;
    const colW = [CONTENT_W * 0.62, CONTENT_W * 0.38];
    rows.forEach((cells, r) => {
      const isHeader = r === 0;
      // Wrap each cell, row height = tallest cell.
      const wrapped = cells.map((c, i) =>
        this.wrap([{ text: sanitize(c), bold: isHeader }], size, colW[i] - padX * 2),
      );
      const rowH = Math.max(...wrapped.map((w) => w.length)) * LEAD.body + 6;
      this.ensure(rowH);
      const top = this.y;
      let cx = MARGIN;
      wrapped.forEach((lines, i) => {
        let ly = top - 3 - size;
        for (const line of lines) {
          let tx = cx + padX;
          for (const run of line) {
            if (run.text === " ") { tx += this.reg.widthOfTextAtSize(" ", size); continue; }
            const f = this.font(run.bold);
            this.page.drawText(run.text, { x: tx, y: ly, size, font: f, color: INK });
            tx += f.widthOfTextAtSize(run.text, size);
          }
          ly -= LEAD.body;
        }
        cx += colW[i];
      });
      // Cell borders.
      const bottom = top - rowH;
      this.page.drawRectangle({
        x: MARGIN, y: bottom, width: colW[0], height: rowH,
        borderColor: RULE, borderWidth: 0.5,
      });
      this.page.drawRectangle({
        x: MARGIN + colW[0], y: bottom, width: colW[1], height: rowH,
        borderColor: RULE, borderWidth: 0.5,
      });
      this.y = bottom;
    });
  }

  /** Stamp "Page n of N" on every page once layout is complete. */
  footer() {
    const n = this.pages.length;
    this.pages.forEach((p, i) => {
      const label = `Page ${i + 1} of ${n}`;
      const w = this.reg.widthOfTextAtSize(label, SIZE.foot);
      p.drawText(label, {
        x: (PAGE.w - w) / 2, y: MARGIN / 2, size: SIZE.foot, font: this.reg, color: RULE,
      });
    });
  }
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isTableSeparator(line: string): boolean {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line);
}
function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

/** Render a personalised document markdown string into a PDF buffer. */
export async function markdownToPdf(markdown: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const layout = new Layout(pdf, reg, bold);

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === "") { layout.gap(LEAD.body * 0.5); continue; }
    if (/^#{1,}\s*$/.test(line)) continue; // empty heading markers (`# `)

    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trimEnd())) {
        if (!isTableSeparator(lines[i].trimEnd())) rows.push(splitRow(lines[i].trimEnd()));
        i++;
      }
      i--;
      layout.gap(4);
      layout.table(rows);
      continue;
    }

    if (line.trim() === "---") { layout.rule(); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const style: Style = h[1].length === 1 ? "h1" : h[1].length === 2 ? "h2" : "h3";
      layout.gap(style === "h1" ? 10 : 6);
      layout.paragraph(toRuns(h[2]), style);
      layout.gap(2);
      continue;
    }

    layout.paragraph(toRuns(line), "body");
  }

  layout.footer();
  return Buffer.from(await pdf.save());
}
