import { currentUser } from "@/app/lib/authz";
import SignOutButton from "./SignOutButton";

/** Signed-in identity + sign-out, shown at the top of every data-room page. */
export default async function SessionBar() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted border-b hairline pb-4 mb-10">
      <span>
        Signed in as <strong className="text-fg">{user.email}</strong>
      </span>
      <SignOutButton />
    </div>
  );
}
