import { NextResponse } from "next/server";
import { saveSettings } from "@/backend/admin/admin-config-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { writeAuditLog } from "@/backend/audit/audit-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("settings:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.csvOnlyUpload !== "boolean" || typeof payload.approvalRequired !== "boolean") {
    return NextResponse.json({ error: "csvOnlyUpload and approvalRequired are required" }, { status: 400 });
  }

  await saveSettings(payload);
  await writeAuditLog({ action: "SETTINGS_UPDATED", actor: guard.session.user.email, status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
