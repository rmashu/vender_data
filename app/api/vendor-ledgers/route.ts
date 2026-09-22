import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listVendorLedgers } from "@/backend/purchase/vendor-ledger-repository";

export async function GET(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const result = await listVendorLedgers(
    {
      fy: url.searchParams.get("fy") ?? undefined,
      gst: url.searchParams.get("gst") ?? undefined,
      store: url.searchParams.get("store") ?? undefined,
      supplier: url.searchParams.get("supplier") ?? undefined,
    },
    {
      limit: Number(url.searchParams.get("limit") ?? "50"),
      page: Number(url.searchParams.get("page") ?? "1"),
    },
  );

  return NextResponse.json(result);
}
