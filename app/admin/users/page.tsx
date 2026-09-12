import { redirect } from "next/navigation";
import { hasPermission } from "@/backend/auth/access-control";
import { getCurrentSession } from "@/backend/auth/session-store";
import { AppShell } from "@/components/app-shell";
import { UsersAdminPanel } from "@/components/admin/users-admin-panel";

export default async function AdminUsersPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, "users:manage")) {
    redirect("/dashboard");
  }

  return (
    <AppShell title="Admin Users" description="Approve users, assign roles and manage access." userEmail={session.user.email}>
      <UsersAdminPanel />
    </AppShell>
  );
}
