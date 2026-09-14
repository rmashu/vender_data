import { NextResponse } from "next/server";
import { listAuditLogs } from "@/backend/audit/audit-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";

export async function GET() {
  const guard = await requireApiPermission("notifications:view");

  if (!guard.ok) {
    return guard.response;
  }

  const logs = await listAuditLogs(20);
  return NextResponse.json({ logs });
}
