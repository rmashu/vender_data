import { redirect } from "next/navigation";
import { adminModules, dashboardModules } from "@/backend/auth/modules";
import { getCurrentSession } from "@/backend/auth/session-store";
import type { PermissionCode } from "@/backend/auth/types";
import { AppShell } from "@/components/app-shell";
import { DashboardWorkspace } from "@/components/dashboard-workspace";

function canView(permissions: PermissionCode[], permission: PermissionCode) {
  return permissions.includes(permission);
}

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const visibleDashboardModules = dashboardModules.filter((module) => canView(session.permissions, module.permission));
  const visibleAdminModules = adminModules.filter((module) => canView(session.permissions, module.permission));

  return (
    <AppShell title="Dashboard" description={`${session.role.name} access`} userEmail={session.user.email}>
      <DashboardWorkspace
        adminModules={visibleAdminModules}
        dashboardModules={visibleDashboardModules}
        permissions={session.permissions}
        user={session.user}
      />
    </AppShell>
  );
}
