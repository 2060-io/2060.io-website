/**
 * Server-only client for the Relaticle CRM REST API (https://crm.2060.io,
 * in-cluster). Turns a contact-form submission into CRM records.
 *
 * Mapping (mirrors the Verana Foundation site):
 *   organization   -> Company    (always created when present; no dedupe)
 *   name/email/…   -> Person      (linked to the company)
 *   full inquiry   -> Note        (linked to the person + company)
 *   lead inquiries -> Opportunity (investor / enterprise; stage = Prospecting)
 *   every inquiry  -> Task        ("To do", Low priority, due in 3 days,
 *                                   assigned to the connected account)
 *
 * Records are created by the API token's user — a "2060.io" service account on
 * the 2060 team — so the CRM shows them as created by 2060.io.
 *
 * Relaticle API contract (v1):
 *   POST /api/v1/people        { name, company_id?, custom_fields:{<code>:value} }
 *   POST /api/v1/companies     { name, custom_fields }
 *   POST /api/v1/notes         { title, people_ids?[], company_ids?[], custom_fields }
 *   POST /api/v1/opportunities { name, company_id?, contact_id?, custom_fields }
 *   POST /api/v1/tasks         { title, assignee_ids?[], people_ids?[], company_ids?[],
 *                                opportunity_ids?[], custom_fields }
 *   GET  /api/v1/custom-fields?entity_type=…  (JSON:API: data[].attributes.{code,name,type,options})
 *   GET  /api/v1/user          (connected account; data.id)
 *   Auth: Authorization: Bearer <token>.
 *
 * `custom_fields` is keyed by each field's *code*. Field codes/types/options are
 * discovered at runtime. Value shape depends on the field type: email/phone/link
 * fields take an ARRAY of values; text/rich-editor/select take a scalar (select
 * = the chosen option's value/id). Each create falls back to a
 * custom-field-free payload if the CRM rejects the custom fields, so a mapping
 * mismatch never loses the core record.
 *
 * Never import this from a client component.
 */

const BASE = process.env.RELATICLE_API_URL?.replace(/\/+$/, "");
const TOKEN = process.env.RELATICLE_API_TOKEN;
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL;

export function crmConfigured(): boolean {
  return Boolean(BASE && TOKEN);
}

export type Inquiry = {
  topic: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  linkedin?: string; // the person's LinkedIn
  companyWebsite?: string; // the company's website (or LinkedIn if a linkedin.com URL)
  message: string;
  source?: string;
  consentAt: string;
};

export type CrmResult = {
  personId?: string;
  companyId?: string;
  noteId?: string;
  opportunityId?: string;
  taskId?: string;
};

const TOPIC_LABELS: Record<string, string> = {
  investor: "Investor",
  enterprise: "Enterprise / consortium",
  press: "Press or analyst",
  hiring: "Hiring",
  general: "General inquiry",
};

// Inquiry types that should also open an Opportunity (a lead in the pipeline).
const LEAD_TOPICS = new Set(["investor", "enterprise"]);

// Custom-field types whose value must be sent as an array (verified against the
// live API: email/phone/link reject scalars; text/select/rich-editor are scalar).
const ARRAY_TYPES = new Set([
  "email",
  "phone",
  "link",
  "url",
  "tags",
  "multi_select",
  "multiselect",
  "checkbox-list",
]);

function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic ?? "Inquiry";
}

// --- low-level HTTP ---------------------------------------------------------

type AnyJson = Record<string, unknown>;

async function api(
  path: string,
  init: { method: string; body?: AnyJson }
): Promise<unknown> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: init.method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Relaticle ${init.method} ${path} -> ${res.status} ${text.slice(0, 400)}`
    );
  }
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

function idOf(resp: unknown): string | undefined {
  const r = resp as { data?: { id?: string }; id?: string } | null;
  return r?.data?.id ?? r?.id;
}

// --- custom-field discovery (cached) ---------------------------------------

type FieldOption = { label: string; value: string };
type CustomField = {
  id: string;
  code: string;
  name: string;
  type: string;
  options: FieldOption[];
};
const cfCache = new Map<string, { at: number; fields: CustomField[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function customFields(entityType: string): Promise<CustomField[]> {
  const cached = cfCache.get(entityType);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.fields;

  const fields: CustomField[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = (await api(
      `/custom-fields?entity_type=${encodeURIComponent(entityType)}&page=${page}`,
      { method: "GET" }
    )) as
      | { data?: Array<Record<string, unknown>>; links?: { next?: string | null } }
      | Array<Record<string, unknown>>;
    const items = Array.isArray(data) ? data : (data?.data ?? []);
    for (const it of items) {
      // JSON:API shape: { id, attributes:{ code, name, type, options } }
      const a = (it.attributes ?? it) as Record<string, unknown>;
      if (a.code) {
        fields.push({
          id: String(it.id ?? a.id ?? ""),
          code: String(a.code),
          name: String(a.name ?? ""),
          type: String(a.type ?? ""),
          options: Array.isArray(a.options)
            ? (a.options as FieldOption[]).map((o) => ({
                label: String(o.label),
                value: String(o.value),
              }))
            : [],
        });
      }
    }
    const next = Array.isArray(data) ? null : data?.links?.next;
    if (!next || items.length === 0) break;
  }

  cfCache.set(entityType, { at: Date.now(), fields });
  return fields;
}

/** The connected account (token owner), used to assign tasks. Cached. */
let userCache: { at: number; id?: string } | null = null;
async function connectedUserId(): Promise<string | undefined> {
  if (userCache && Date.now() - userCache.at < CACHE_TTL_MS) return userCache.id;
  try {
    const id = idOf(await api("/user", { method: "GET" }));
    userCache = { at: Date.now(), id };
    return id;
  } catch {
    return undefined;
  }
}

/** Find a field by candidate codes (preferred), then a name/code regex fallback. */
function findField(
  fields: CustomField[],
  codes: string[],
  nameRe?: RegExp
): CustomField | undefined {
  const byCode = fields.find((f) =>
    codes.some((c) => c.toLowerCase() === f.code.toLowerCase())
  );
  if (byCode) return byCode;
  return nameRe
    ? fields.find((f) => nameRe.test(f.code) || nameRe.test(f.name))
    : undefined;
}

/** The value (option id) of a select field's option whose label matches. */
function optionValue(
  field: CustomField | undefined,
  labelRe: RegExp
): string | undefined {
  return field?.options.find((o) => labelRe.test(o.label))?.value;
}

/** Add `value` to `target` under the field's code, shaped per the field type. */
function addCustom(
  target: AnyJson,
  field: CustomField | undefined,
  value: string | undefined
): void {
  if (!field || !value) return;
  target[field.code] = ARRAY_TYPES.has(field.type.toLowerCase())
    ? [value]
    : value;
}

/** POST with custom fields, retrying without them if the CRM rejects them. */
async function createWithFallback(
  path: string,
  base: AnyJson,
  custom: AnyJson
): Promise<unknown> {
  try {
    return await api(path, { method: "POST", body: { ...base, custom_fields: custom } });
  } catch (err) {
    if (Object.keys(custom).length === 0) throw err;
    console.warn(
      `[relaticle] ${path} create with custom_fields failed, retrying without them:`,
      String(err).slice(0, 300)
    );
    return api(path, { method: "POST", body: { ...base, custom_fields: {} } });
  }
}

// --- content helpers --------------------------------------------------------

function noteTitle(inq: Inquiry): string {
  const org = inq.organization ? ` (${inq.organization})` : "";
  return `${topicLabel(inq.topic)} — ${inq.name}${org}`.slice(0, 255);
}

function noteBody(inq: Inquiry): string {
  const lines = [
    `Inquiry type: ${topicLabel(inq.topic)}`,
    `Name: ${inq.name}`,
    `Email: ${inq.email}`,
    inq.linkedin ? `LinkedIn: ${inq.linkedin}` : null,
    inq.organization ? `Organization: ${inq.organization}` : null,
    inq.companyWebsite ? `Company website: ${inq.companyWebsite}` : null,
    inq.role ? `Role: ${inq.role}` : null,
    inq.source ? `Heard about us: ${inq.source}` : null,
    `Consent: yes (${inq.consentAt})`,
    "",
    "Message:",
    inq.message,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

// --- orchestration ----------------------------------------------------------

export async function submitInquiry(inq: Inquiry): Promise<CrmResult> {
  const result: CrmResult = {};

  // 1) Company (always create when an organization is given; no dedupe). The
  // "company website" goes to the company LinkedIn field for linkedin.com URLs,
  // otherwise to the company domains/website field.
  if (inq.organization?.trim()) {
    const cf = await customFields("company");
    const fields: AnyJson = {};
    const w = inq.companyWebsite?.trim();
    if (w) {
      const field = /linkedin\.com/i.test(w)
        ? findField(cf, ["linkedin"], /linkedin/i)
        : findField(cf, ["domains", "domain", "website", "url"], /domain|website|url|link/i);
      addCustom(fields, field, w);
    }
    const company = await createWithFallback(
      "/companies",
      { name: inq.organization.trim() },
      fields
    );
    result.companyId = idOf(company);
  }

  // 2) Person (linked to the company): email, job title, the person's LinkedIn.
  {
    const cf = await customFields("people");
    const fields: AnyJson = {};
    addCustom(fields, findField(cf, ["emails", "email"], /email/i), inq.email);
    addCustom(
      fields,
      findField(cf, ["job_title"], /job.?title|role|position|title/i),
      inq.role
    );
    addCustom(
      fields,
      findField(cf, ["linkedin", "links", "url"], /linkedin|link|url/i),
      inq.linkedin
    );
    const person = await createWithFallback(
      "/people",
      { name: inq.name, company_id: result.companyId ?? null },
      fields
    );
    result.personId = idOf(person);
  }

  // 3) Note carrying the full inquiry, linked to the person + company.
  {
    const cf = await customFields("note");
    const fields: AnyJson = {};
    addCustom(
      fields,
      findField(
        cf,
        ["body", "content", "description", "note"],
        /body|content|description|note|message|text/i
      ),
      noteBody(inq)
    );
    const note = await createWithFallback(
      "/notes",
      {
        title: noteTitle(inq),
        people_ids: result.personId ? [result.personId] : [],
        company_ids: result.companyId ? [result.companyId] : [],
      },
      fields
    );
    result.noteId = idOf(note);
  }

  // 4) Opportunity for lead-type inquiries, stage = Prospecting.
  if (LEAD_TOPICS.has(inq.topic)) {
    const cf = await customFields("opportunity");
    const fields: AnyJson = {};
    const stage = findField(cf, ["stage"], /stage/i);
    const prospecting = optionValue(stage, /prospect/i);
    if (stage && prospecting) fields[stage.code] = prospecting;
    const opp = await createWithFallback(
      "/opportunities",
      {
        name: noteTitle(inq),
        company_id: result.companyId ?? null,
        contact_id: result.personId ?? null,
      },
      fields
    );
    result.opportunityId = idOf(opp);
  }

  // 5) Follow-up Task (every inquiry): status "To do", Low priority, due in
  // 3 days, assigned to the connected account, linked to the records above.
  {
    const cf = await customFields("task");
    const fields: AnyJson = {};
    const status = findField(cf, ["status"], /status/i);
    const todo = optionValue(status, /^to.?do$|todo/i);
    if (status && todo) fields[status.code] = todo;
    const priority = findField(cf, ["priority"], /priority/i);
    const low = optionValue(priority, /^low$/i);
    if (priority && low) fields[priority.code] = low;
    const dueField = findField(cf, ["due_date", "due"], /due/i);
    if (dueField) {
      const due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      fields[dueField.code] = due.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
    const userId = await connectedUserId();
    const task = await createWithFallback(
      "/tasks",
      {
        title: `Follow up: ${noteTitle(inq)}`.slice(0, 255),
        assignee_ids: userId ? [userId] : [],
        people_ids: result.personId ? [result.personId] : [],
        company_ids: result.companyId ? [result.companyId] : [],
        opportunity_ids: result.opportunityId ? [result.opportunityId] : [],
      },
      fields
    );
    result.taskId = idOf(task);
  }

  return result;
}

/** Best-effort ops alert (Discord/Slack-compatible webhook). No-op if unset. */
export async function alertOps(message: string): Promise<void> {
  if (!ALERT_WEBHOOK) return;
  try {
    await fetch(ALERT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
      cache: "no-store",
    });
  } catch {
    /* swallow — alerting must never throw */
  }
}
