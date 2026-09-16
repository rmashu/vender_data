import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listPurchaseMaster, savePurchaseMaster } from "@/backend/purchase/purchase-master-repository";

export async function GET(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const rows = await listPurchaseMaster({
    fy: url.searchParams.get("fy") ?? undefined,
    store_name: url.searchParams.get("store") ?? undefined,
    supplier: url.searchParams.get("supplier") ?? undefined,
  });

  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!isPayload(payload)) {
    return NextResponse.json({ error: "fy, store_name, supplier and gst_no are required" }, { status: 400 });
  }

  await savePurchaseMaster(
    {
      fy: payload.fy.trim(),
      gst_no: payload.gst_no.trim().toUpperCase(),
      status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      store_name: payload.store_name.trim().toUpperCase(),
      supplier: payload.supplier.trim(),
    },
    guard.session.user.email,
  );

  return NextResponse.json({ success: true });
}

function isPayload(value: unknown): value is { fy: string; gst_no: string; status?: string; store_name: string; supplier: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{ fy: string; gst_no: string; store_name: string; supplier: string }>;
  return Boolean(payload.fy && payload.gst_no && payload.store_name && payload.supplier);
}
