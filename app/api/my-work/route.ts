import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listMyBatches } from "@/backend/records/record-repository";

export async function GET() {
  const guard = await requireApiPermission("ledger:view");

  if (!guard.ok) {
    return guard.response;
  }

  return NextResponse.json(await listMyBatches(guard.session));
}
