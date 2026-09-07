/**
 * Personalises an NDA template (a file in legal/) for a specific signer.
 * Ported from the veranafoundation.org agreement-template machinery, reduced to
 * what the NDA needs.
 *
 * Template syntax:
 *   {{value}}                                — substituted with a context value
 *   <!--IF:flag-->A<!--ELSE-->B<!--ENDIF-->  — A when `flag` is true, else B
 * IF blocks may be nested (none are used by nda-v1, but future versions may).
 */

export type NdaContext = {
  orgName: string;
  signerName: string;
  signerEmail: string;
  effectiveDate: Date;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Resolve the template context into boolean flags and string values. */
export function buildNdaValues(ctx: NdaContext): {
  flags: Record<string, boolean>;
  values: Record<string, string>;
} {
  const d = ctx.effectiveDate;
  return {
    flags: {},
    values: {
      org_name: ctx.orgName.trim(),
      signer_name: ctx.signerName.trim(),
      signer_email: ctx.signerEmail.trim(),
      effective_date: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      effective_year: String(d.getUTCFullYear()),
    },
  };
}

/** Resolve <!--IF:flag-->...<!--ELSE-->...<!--ENDIF--> blocks, innermost first. */
function resolveConditionals(text: string, flags: Record<string, boolean>): string {
  const innermost = /<!--IF:(\w+)-->((?:(?!<!--IF:|<!--ENDIF-->)[\s\S])*?)<!--ENDIF-->/;
  let out = text;
  let guard = 0;
  while (innermost.test(out)) {
    if (++guard > 1000) throw new Error("nda template: unbalanced IF/ENDIF");
    out = out.replace(innermost, (_m, flag: string, body: string) => {
      const elseIdx = body.indexOf("<!--ELSE-->");
      const whenTrue = elseIdx === -1 ? body : body.slice(0, elseIdx);
      const whenFalse = elseIdx === -1 ? "" : body.slice(elseIdx + "<!--ELSE-->".length);
      if (!(flag in flags)) throw new Error(`nda template: unknown flag "${flag}"`);
      return flags[flag] ? whenTrue : whenFalse;
    });
  }
  return out;
}

/** Apply a fully-built context to a raw template string. */
export function resolveNdaTemplate(template: string, ctx: NdaContext): string {
  const { flags, values } = buildNdaValues(ctx);
  let out = resolveConditionals(template, flags);
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (!(key in values)) throw new Error(`nda template: unknown placeholder "${key}"`);
    return values[key];
  });
  const leftover = out.match(/\{\{[^}]+\}\}|<!--(?:IF:|ELSE|ENDIF)/);
  if (leftover) throw new Error(`nda template: unresolved token "${leftover[0]}"`);
  return out;
}
