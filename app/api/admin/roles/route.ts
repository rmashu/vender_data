import { NextResponse } from "next/server";
import { saveRoles } from "@/backend/admin/admin-config-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { writeAuditLog } from "@/backend/audit/audit-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("roles:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || !Array.isArray(payload.roles)) {
    return NextResponse.json({ error: "roles array is required" }, { status: 400 });
  }

  await saveRoles(payload.roles);
  await writeAuditLog({ action: "ROLES_UPDATED", actor: guard.session.user.email, status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
