import { NextResponse } from "next/server";
import { saveRolePermissions } from "@/backend/admin/admin-config-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { writeAuditLog } from "@/backend/audit/audit-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("permissions:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || !payload.rolePermissions) {
    return NextResponse.json({ error: "rolePermissions is required" }, { status: 400 });
  }

  await saveRolePermissions(payload.rolePermissions);
  await writeAuditLog({ action: "PERMISSIONS_UPDATED", actor: guard.session.user.email, status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
