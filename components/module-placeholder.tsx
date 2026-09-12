import { redirect } from "next/navigation";
import { hasPermission } from "@/backend/auth/access-control";
import { getCurrentSession } from "@/backend/auth/session-store";
import type { PermissionCode } from "@/backend/auth/types";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePlaceholderProps = {
  description: string;
  permission: PermissionCode;
  title: string;
};

export async function ModulePlaceholder({ description, permission, title }: ModulePlaceholderProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, permission)) {
    redirect("/dashboard");
  }

  return (
    <AppShell title={title} description={description} userEmail={session.user.email}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </AppShell>
  );
}
