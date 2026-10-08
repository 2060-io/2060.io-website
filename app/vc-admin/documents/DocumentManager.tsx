"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import {
  addDocument,
  replaceDocument,
  removeDocument,
  setSortOrder,
  toggleAlwaysVisible,
  type DocState,
} from "./actions";
import { SORT_ORDER_LIMIT } from "@/app/lib/document-order";

export type DocRow = {
  id: string;
  kind: "file" | "url";
  title: string;
  sortOrder: number | null;
  filename: string;
  viewable: boolean; // PDF / HTML / Markdown: can be opened in the browser
  url: string | null;
  size: string; // preformatted; "" for URL entries
  version: number;
  updatedAt: string; // preformatted
  updatedBy: string;
  alwaysVisible: boolean;
  grants: number;
  downloads: number;
};

function AddForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<"file" | "url">("file");
  const [state, action, pending] = useActionState<DocState, FormData>(
    async (prev, fd) => {
      const res = await addDocument(prev, fd);
      if (res.ok) {
        formRef.current?.reset();
        setKind("file");
      }
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 max-w-xl">
      <div className="flex items-center gap-5 text-sm mb-1">
        {(["file", "url"] as const).map((k) => (
          <label key={k} className="flex items-center gap-1.5">
            <input
              type="radio"
              name="entryKind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
            />
            {k === "file" ? "Document (file)" : "URL"}
          </label>
        ))}
      </div>
      <input
        name="title"
        type="text"
        required
        placeholder={kind === "file" ? "Document title (shown to VCs)" : "Link label (shown to VCs)"}
        className="field text-sm"
        aria-label="Title"
      />
      <div className="flex items-center gap-3">
        <input
          name="sortOrder"
          type="number"
          step="1"
          min={-SORT_ORDER_LIMIT}
          max={SORT_ORDER_LIMIT}
          placeholder="Order"
          className="field text-sm w-28"
          aria-label="Order"
        />
        <p className="text-xs text-muted">
          Position in the lists, lowest first. Leave blank to list it after the
          ordered entries.
        </p>
      </div>
      {kind === "file" ? (
        <>
          <input name="file" type="file" required className="field text-sm" aria-label="File" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="alwaysVisible" />
            Always visible — every invited email sees it, no per-email selection
            needed
          </label>
        </>
      ) : (
        <>
          <input
            name="url"
            type="url"
            required
            placeholder="https://…"
            className="field text-sm"
            aria-label="URL"
          />
          <p className="text-xs text-muted">
            URL entries are always visible to every invited email and open in a
            new window.
          </p>
        </>
      )}
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? (kind === "file" ? "Uploading…" : "Adding…") : kind === "file" ? "Add document" : "Add URL"}
        </button>
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state.ok && <p className="text-sm text-accent-hover">Added.</p>}
      </div>
    </form>
  );
}

/**
 * Inline editor for a document's position in the lists. Saves on Enter or when
 * the field loses focus with a changed value; blank clears the order.
 */
function OrderCell({ id, sortOrder }: { id: string; sortOrder: number | null }) {
  const initial = sortOrder === null ? "" : String(sortOrder);
  return (
    <form action={setSortOrder}>
      <input type="hidden" name="id" value={id} />
      <input
        key={initial}
        name="sortOrder"
        type="number"
        step="1"
        min={-SORT_ORDER_LIMIT}
        max={SORT_ORDER_LIMIT}
        defaultValue={initial}
        placeholder="–"
        aria-label="Order"
        title="Position in the lists, lowest first; blank = after the ordered entries. Saves on Enter or when you leave the field."
        className="field text-xs w-16 text-right"
        onBlur={(e) => {
          if (e.currentTarget.value.trim() !== initial) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
    </form>
  );
}

function ReplaceControl({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DocState, FormData>(
    async (prev, fd) => {
      const res = await replaceDocument(prev, fd);
      if (res.ok) setOpen(false);
      return res;
    },
    {},
  );
  if (!open) {
    return (
      <button
        type="button"
        className="prose-link text-fg text-sm"
        onClick={() => setOpen(true)}
      >
        replace
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="file" type="file" required className="field text-xs max-w-52" aria-label="New file" />
      <button type="submit" className="btn text-xs" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
      <button type="button" className="text-xs text-muted" onClick={() => setOpen(false)}>
        cancel
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

export default function DocumentManager({ docs }: { docs: DocRow[] }) {
  return (
    <div className="grid gap-12 mt-10">
      <section>
        <h2 className="display text-xl mb-4">Add to the repository</h2>
        <AddForm />
      </section>

      <section>
        <h2 className="display text-xl mb-4">Repository</h2>
        <div className="overflow-x-auto">
          <table className="clean min-w-[820px]">
            <thead>
              <tr>
                <th className="w-6" aria-label="Type"></th>
                <th>Order</th>
                <th>Title</th>
                <th>File / URL</th>
                <th>Size</th>
                <th>v</th>
                <th>Updated</th>
                <th>Visibility</th>
                <th>Opens</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <i
                      className={`fa-solid ${d.kind === "url" ? "fa-link" : "fa-file"} text-muted text-xs`}
                      title={d.kind === "url" ? "URL entry" : "Uploaded document"}
                      aria-label={d.kind === "url" ? "URL entry" : "Uploaded document"}
                    ></i>
                  </td>
                  <td>
                    <OrderCell id={d.id} sortOrder={d.sortOrder} />
                  </td>
                  <td className="text-fg">{d.title}</td>
                  <td className="text-muted break-all">
                    {d.kind === "url" ? (
                      <a
                        href={d.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prose-link"
                      >
                        {d.url}
                      </a>
                    ) : d.viewable ? (
                      <span className="inline-flex flex-wrap items-baseline gap-x-2">
                        <a
                          href={`/vc-admin/documents/${d.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prose-link"
                          title="View in a new tab — what VCs see"
                        >
                          {d.filename}
                        </a>
                        <a
                          href={`/vc-admin/documents/${d.id}/file`}
                          className="prose-link text-xs"
                          download
                        >
                          download
                        </a>
                      </span>
                    ) : (
                      <a href={`/vc-admin/documents/${d.id}/file`} className="prose-link">
                        {d.filename}
                      </a>
                    )}
                  </td>
                  <td className="text-muted whitespace-nowrap">
                    {d.kind === "url" ? "–" : d.size}
                  </td>
                  <td className="text-muted">{d.kind === "url" ? "–" : d.version}</td>
                  <td className="text-muted whitespace-nowrap" title={`by ${d.updatedBy}`}>
                    {d.updatedAt}
                  </td>
                  <td>
                    {d.kind === "url" ? (
                      <span
                        className="text-accent-hover text-sm whitespace-nowrap"
                        title="URL entries are always visible to every invited email"
                      >
                        everyone
                      </span>
                    ) : (
                      <form
                        action={toggleAlwaysVisible}
                        onSubmit={(e) => {
                          if (
                            !d.alwaysVisible &&
                            !confirm(
                              `Make "${d.title}" visible to ALL invited emails?`,
                            )
                          )
                            e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className="prose-link text-sm whitespace-nowrap"
                          title={
                            d.alwaysVisible
                              ? "Click to switch to manual per-email sharing"
                              : "Click to make visible to every invited email"
                          }
                        >
                          {d.alwaysVisible ? (
                            <span className="text-accent-hover">everyone</span>
                          ) : (
                            <span className="text-muted">
                              {d.grants} email{d.grants === 1 ? "" : "s"}
                            </span>
                          )}
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="text-muted">{d.downloads}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      {d.kind === "file" && <ReplaceControl id={d.id} />}
                      <form
                        action={removeDocument}
                        onSubmit={(e) => {
                          if (
                            !confirm(
                              `Remove "${d.title}"? VCs lose access; access history is kept.`,
                            )
                          )
                            e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="prose-link text-fg text-sm">
                          remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-muted">
                    Nothing yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">
          A document keeps its identity across replacements: grants and access
          history stay attached; the file is versioned. Click the Visibility
          cell to toggle between <strong className="text-fg">everyone</strong>{" "}
          (all invited emails) and manual sharing, chosen per invited email on
          the Invitations page. URL entries are always visible and open in a
          new window; the Opens column counts VC accesses for both kinds. PDF,
          HTML and Markdown files can be viewed in the browser — VCs get a View
          button next to Download, and the file name here opens the same view —
          everything else downloads. The Order column sets the position in
          every list (lowest first; blank entries follow the ordered ones,
          newest first) and saves on Enter or when you leave the field.
        </p>
      </section>
    </div>
  );
}
