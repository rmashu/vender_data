import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listRecords } from "@/backend/records/record-repository";

export async function GET(request: Request) {
  const guard = await requireApiPermission("ledger:view");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const result = await listRecords(
    {
      query: url.searchParams.get("q") ?? undefined,
      store: url.searchParams.get("store") ?? undefined,
    },
    guard.session,
  );

  return NextResponse.json(result);
}
