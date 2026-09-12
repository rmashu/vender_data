import { NextResponse } from "next/server";
import { saveMasterData } from "@/backend/admin/admin-config-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { writeAuditLog } from "@/backend/audit/audit-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || !Array.isArray(payload.vendors) || !Array.isArray(payload.stores)) {
    return NextResponse.json({ error: "vendors and stores arrays are required" }, { status: 400 });
  }

  await saveMasterData({ stores: payload.stores, vendors: payload.vendors });
  await writeAuditLog({ action: "MASTER_DATA_UPDATED", actor: guard.session.user.email, status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
