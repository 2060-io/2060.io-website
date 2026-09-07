"use client";

import { useActionState } from "react";
import { signNda, type SignNdaState } from "./actions";

/**
 * The accept-and-sign controls under the rendered NDA. On success the server
 * action revalidates /dataroom, which re-renders past the gate; reload as a
 * fallback so the signer always lands in the document area.
 */
export default function NdaSignForm({
  orgName,
  defaultSignerName,
}: {
  orgName: string;
  defaultSignerName: string;
}) {
  const [state, formAction, pending] = useActionState<SignNdaState, FormData>(
    async (prev, formData) => {
      const res = await signNda(prev, formData);
      if (res.ok) window.location.reload();
      return res;
    },
    {},
  );

  return (
    <form action={formAction} className="mt-8 max-w-xl flex flex-col gap-4">
      <div>
        <label htmlFor="signerName" className="text-sm text-muted block mb-1">
          Your full name (as signatory)
        </label>
        <input
          id="signerName"
          name="signerName"
          type="text"
          required
          defaultValue={defaultSignerName}
          className="field text-sm"
          autoComplete="name"
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="authorized" required className="mt-1" />
        <span>
          I am authorized to enter into this agreement on behalf of{" "}
          <strong className="text-fg">{orgName}</strong>, and I accept the
          Non-Disclosure Agreement above. It covers everyone from {orgName}{" "}
          invited to this data room.
        </span>
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        className="btn btn-primary w-fit"
        disabled={pending}
      >
        {pending ? "Signing…" : "Accept & sign the NDA"}
      </button>
      <p className="text-xs text-muted">
        You will receive your signed copy by email.
      </p>
    </form>
  );
}
