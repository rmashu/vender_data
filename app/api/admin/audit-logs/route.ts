import { NextResponse } from "next/server";
import { listAuditLogs } from "@/backend/audit/audit-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";

export async function GET() {
  const guard = await requireApiPermission("audit:view");

  if (!guard.ok) {
    return guard.response;
  }

  const logs = await listAuditLogs();
  return NextResponse.json({ logs });
}
