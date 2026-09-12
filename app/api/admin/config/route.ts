import { NextResponse } from "next/server";
import { getAdminConfig } from "@/backend/admin/admin-config-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";

export async function GET() {
  const guard = await requireApiPermission("admin:view");

  if (!guard.ok) {
    return guard.response;
  }

  const config = await getAdminConfig();
  return NextResponse.json(config);
}
