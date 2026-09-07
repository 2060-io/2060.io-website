"use client";

import { useActionState } from "react";
import {
  saveTemplate,
  resetTemplate,
  sendTestEmail,
  type TemplateState,
} from "./actions";

export default function TemplateEditor({
  subject,
  bodyMarkdown,
  customized,
}: {
  subject: string;
  bodyMarkdown: string;
  customized: boolean;
}) {
  const [saveState, saveAction, saving] = useActionState<TemplateState, FormData>(
    saveTemplate,
    {},
  );
  const [testState, testAction, testing] = useActionState<TemplateState, FormData>(
    sendTestEmail,
    {},
  );

  return (
    <div className="mt-8 max-w-2xl">
      <form action={saveAction} className="flex flex-col gap-3">
        <div>
          <label htmlFor="subject" className="text-sm text-muted block mb-1">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            defaultValue={subject}
            className="field text-sm"
          />
        </div>
        <div>
          <label htmlFor="bodyMarkdown" className="text-sm text-muted block mb-1">
            Body (Markdown — **bold**, headings, plain paragraphs)
          </label>
          <textarea
            id="bodyMarkdown"
            name="bodyMarkdown"
            required
            rows={14}
            defaultValue={bodyMarkdown}
            className="field text-sm font-mono"
          />
        </div>
        <p className="text-xs text-muted">
          Placeholders: <code>{"{{org_name}}"}</code>, <code>{"{{email}}"}</code>,{" "}
          <code>{"{{login_url}}"}</code>. The 2060 and Verana Foundation logos
          and the “Open the data room” button come from the email shell.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save template"}
          </button>
          {saveState.error && (
            <p className="text-sm text-red-500">{saveState.error}</p>
          )}
          {saveState.ok && (
            <p className="text-sm text-accent-hover">{saveState.message}</p>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t hairline">
        <form action={testAction}>
          <button type="submit" className="btn" disabled={testing}>
            {testing ? "Sending…" : "Send a test to me"}
          </button>
        </form>
        {customized && (
          <form
            action={resetTemplate}
            onSubmit={(e) => {
              if (!confirm("Reset to the default template?")) e.preventDefault();
            }}
          >
            <button type="submit" className="prose-link text-fg text-sm">
              reset to default
            </button>
          </form>
        )}
        {testState.error && (
          <p className="text-sm text-red-500">{testState.error}</p>
        )}
        {testState.ok && (
          <p className="text-sm text-accent-hover">{testState.message}</p>
        )}
      </div>
      <p className="text-xs text-muted mt-2">
        The test (and the preview below) uses the last <strong>saved</strong>{" "}
        template — save first to try edits.
      </p>
    </div>
  );
}
