import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin, isVcAdmin, vcInviteFor } from "@/app/lib/authz";

export const dynamic = "force-dynamic";

// Lightweight "who am I + where can I go" for the header. Returns the current
// user (or null) and their role-based menu entries. Fetched client-side by the
// nav's UserMenu so the public marketing pages stay fully static.
export async function GET() {
  const session = await auth();
  const user = session?.user;
  if (!user?.email) {
    return NextResponse.json({ user: null, actions: [] });
  }

  const [admin, vcAdmin, invite] = await Promise.all([
    isAdmin(user.email),
    isVcAdmin(user.email),
    vcInviteFor(user.email),
  ]);

  const actions: { label: string; href: string; icon: string }[] = [];
  if (admin) actions.push({ label: "Admin", href: "/admin", icon: "shield" });
  if (vcAdmin) actions.push({ label: "VC admin", href: "/vc-admin", icon: "users" });
  if (invite) actions.push({ label: "Data room", href: "/dataroom", icon: "folder" });

  // An email that lost every role (e.g. a revoked invite) still has a session;
  // show nothing but the sign-out.
  return NextResponse.json({
    user: {
      name: user.name ?? null,
      email: user.email,
      image: user.image ?? null,
    },
    actions,
  });
}
