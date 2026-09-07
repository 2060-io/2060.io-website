"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { addDocument, replaceDocument, removeDocument, type DocState } from "./actions";

export type DocRow = {
  id: string;
  title: string;
  filename: string;
  size: string; // preformatted
  version: number;
  updatedAt: string; // preformatted
  updatedBy: string;
  grants: number;
  downloads: number;
};

function AddForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<DocState, FormData>(
    async (prev, fd) => {
      const res = await addDocument(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 max-w-xl">
      <input
        name="title"
        type="text"
        required
        placeholder="Document title (shown to VCs)"
        className="field text-sm"
        aria-label="Document title"
      />
      <input name="file" type="file" required className="field text-sm" aria-label="File" />
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Uploading…" : "Add document"}
        </button>
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state.ok && <p className="text-sm text-accent-hover">Added.</p>}
      </div>
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
        <h2 className="display text-xl mb-4">Add a document</h2>
        <AddForm />
      </section>

      <section>
        <h2 className="display text-xl mb-4">Repository</h2>
        <div className="overflow-x-auto">
          <table className="clean min-w-[820px]">
            <thead>
              <tr>
                <th>Title</th>
                <th>File</th>
                <th>Size</th>
                <th>v</th>
                <th>Updated</th>
                <th>Visible to</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="text-fg">{d.title}</td>
                  <td className="text-muted break-all">
                    <a href={`/vc-admin/documents/${d.id}/file`} className="prose-link">
                      {d.filename}
                    </a>
                  </td>
                  <td className="text-muted whitespace-nowrap">{d.size}</td>
                  <td className="text-muted">{d.version}</td>
                  <td className="text-muted whitespace-nowrap" title={`by ${d.updatedBy}`}>
                    {d.updatedAt}
                  </td>
                  <td className="text-muted">{d.grants} email{d.grants === 1 ? "" : "s"}</td>
                  <td className="text-muted">{d.downloads}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <ReplaceControl id={d.id} />
                      <form
                        action={removeDocument}
                        onSubmit={(e) => {
                          if (
                            !confirm(
                              `Remove "${d.title}"? VCs lose access; download history is kept.`,
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
                  <td colSpan={8} className="text-muted">
                    No documents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">
          A document keeps its identity across replacements: grants and download
          history stay attached; the file is versioned. Who sees which document
          is chosen per invited email on the Invitations page.
        </p>
      </section>
    </div>
  );
}
