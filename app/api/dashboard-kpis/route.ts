import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { getDashboardKpis } from "@/backend/records/record-repository";

export async function GET() {
  const guard = await requireApiPermission("dashboard:view");

  if (!guard.ok) {
    return guard.response;
  }

  return NextResponse.json(await getDashboardKpis(guard.session));
}
