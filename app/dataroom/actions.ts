"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";
import { loadActiveNda } from "@/app/lib/nda-versions";
import { persistSignedNda, sendExecutedNdaEmail } from "@/app/lib/signed-nda";

export type SignNdaState = { error?: string; ok?: boolean };

const inputSchema = z.object({
  signerName: z.string().trim().min(1, "Enter your full name."),
  authorized: z.literal("on", {
    message: "Confirm you are authorized to sign for your organization.",
  }),
});

/**
 * Click-to-sign the active NDA for the signed-in VC's organization. One
 * signature per org (the unique orgId constraint is the arbiter under
 * concurrency); afterwards every VC invited under the org passes the gate.
 */
export async function signNda(
  _prev: SignNdaState,
  formData: FormData,
): Promise<SignNdaState> {
  const user = await currentUser();
  if (!user?.email) return { error: "Not signed in." };
  const invite = await vcInviteFor(user.email);
  if (!invite) return { error: "Your email is not invited to the data room." };

  const parsed = inputSchema.safeParse({
    signerName: formData.get("signerName"),
    authorized: formData.get("authorized"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const nda = await loadActiveNda();
  if (!nda) return { error: "No NDA is configured yet — please try again later." };
  if (!nda.intact) {
    return { error: "The NDA document failed its integrity check — signing is blocked. Please contact us." };
  }

  const signedAt = new Date();
  const ctx = {
    orgName: invite.org.name,
    signerName: parsed.data.signerName,
    signerEmail: user.email,
    effectiveDate: signedAt,
  };

  let signature;
  try {
    signature = await db.ndaSignature.create({
      data: {
        orgId: invite.orgId,
        ndaDocumentId: nda.id,
        signerUserId: user.id ?? null,
        signerEmail: user.email.toLowerCase(),
        signerName: ctx.signerName,
        signedAt,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // A colleague signed concurrently — the org is covered; just proceed.
      revalidatePath("/dataroom");
      return { ok: true };
    }
    throw e;
  }

  // Render + persist the signed PDF and email the signer their copy. Both are
  // best-effort: the signature row above is the legal record of acceptance.
  try {
    const { pdf } = await persistSignedNda({
      orgId: invite.orgId,
      signatureId: signature.id,
      ctx,
      template: nda.content,
    });
    await sendExecutedNdaEmail({
      to: user.email,
      orgName: invite.org.name,
      signerName: ctx.signerName,
      signedAt,
      ndaVersion: nda.version,
      pdf,
    });
  } catch (e) {
    console.error("[sign-nda] post-signature rendering/email failed", e);
  }

  revalidatePath("/dataroom");
  return { ok: true };
}
