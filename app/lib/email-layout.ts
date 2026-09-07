// Shared branded HTML shell for all data-room transactional emails: a 2060
// wordmark header (with the Verana Foundation logo alongside when configured),
// themed CTA button, and footer. Table-based + inline styles for broad
// email-client support. Colours follow the site's light theme (globals.css).

const SITE_URL = process.env.AUTH_URL ?? "https://2060.io";

// Light-theme design tokens (globals.css).
const ACCENT = "#553C9A"; // --accent
const ACCENT_HOVER = "#763EF0"; // --accent-hover (light)
const INK = "#0a0a0a"; // --fg (light)
const MUTED = "#525252"; // --muted (light)
const RULE = "#e5e5e5";
const SURFACE = "#fafafa";
const CARD = "#ffffff";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailButton = { label: string; href: string };

/**
 * Email header logos. Uses hosted rasters when EMAIL_LOGO_URL /
 * EMAIL_VERANA_LOGO_URL are set (SVG/remote images render unreliably in many
 * clients — prefer small PNGs), otherwise styled text wordmarks. The Verana
 * Foundation mark sits alongside 2060's, as the data room is presented by both.
 */
function logos(): string {
  const url2060 = process.env.EMAIL_LOGO_URL;
  const urlVerana = process.env.EMAIL_VERANA_LOGO_URL;
  const mark2060 = url2060
    ? `<img src="${url2060}" alt="2060" height="28" style="display:block;border:0;outline:none;text-decoration:none;height:28px;">`
    : `<span style="font-family:${FONT};font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.01em;">2060</span>`;
  const markVerana = urlVerana
    ? `<img src="${urlVerana}" alt="Verana Foundation" height="24" style="display:block;border:0;outline:none;text-decoration:none;height:24px;">`
    : `<span style="font-family:${FONT};font-size:15px;font-weight:600;color:${INK};">Verana<span style="color:#763ef0;">Foundation</span></span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle;">${mark2060}</td>
    <td style="vertical-align:middle;padding:0 12px;color:${RULE};font-family:${FONT};font-size:18px;">|</td>
    <td style="vertical-align:middle;">${markVerana}</td>
  </tr></table>`;
}

/** Wrap email body HTML in the branded shell. `bodyHtml` is trusted HTML. */
export function emailLayout(opts: {
  heading?: string;
  bodyHtml: string;
  button?: EmailButton;
}): string {
  const button = opts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
         <tr><td style="background:${ACCENT};">
           <a href="${opts.button.href}"
              style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:600;
                     color:#ffffff;text-decoration:none;border:1px solid ${ACCENT_HOVER};">
             ${opts.button.label}
           </a>
         </td></tr>
       </table>`
    : "";

  const heading = opts.heading
    ? `<h1 style="margin:0 0 14px;font-family:${FONT};font-size:20px;line-height:1.3;font-weight:600;color:${INK};">${opts.heading}</h1>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:${SURFACE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:560px;background:${CARD};border:1px solid ${RULE};">
        <tr><td style="padding:24px 28px;border-bottom:1px solid ${RULE};">${logos()}</td></tr>
        <tr><td style="padding:28px;font-family:${FONT};font-size:14px;line-height:1.6;color:${INK};">
          ${heading}${opts.bodyHtml}${button}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${RULE};font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED};">
          2060 OÜ · founding member of the Verana Foundation.<br>
          <a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">2060.io</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
