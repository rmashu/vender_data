import { redirect } from "next/navigation";
import { hasPermission } from "@/backend/auth/access-control";
import { getCurrentSession } from "@/backend/auth/session-store";
import { AppShell } from "@/components/app-shell";
import { LedgerWorkspace } from "@/components/ledger/ledger-workspace";

export default async function LedgerPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, "ledger:view")) {
    redirect("/dashboard");
  }

  return (
    <AppShell title="Vendor Ledger" description="Edit, review and save ledger entries." userEmail={session.user.email}>
      <LedgerWorkspace />
    </AppShell>
  );
}
