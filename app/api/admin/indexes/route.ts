import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { ensureDatabaseIndexes } from "@/backend/database/indexes";

export async function POST() {
  const guard = await requireApiPermission("settings:manage");

  if (!guard.ok) {
    return guard.response;
  }

  await ensureDatabaseIndexes();
  return NextResponse.json({ success: true });
}
