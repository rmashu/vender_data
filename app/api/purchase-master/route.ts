import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listPurchaseMaster, savePurchaseMaster } from "@/backend/purchase/purchase-master-repository";

export async function GET(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const result = await listPurchaseMaster(
    {
      firstBillFrom: url.searchParams.get("firstBillFrom") ?? undefined,
      firstBillTo: url.searchParams.get("firstBillTo") ?? undefined,
      fy: toList(url.searchParams.get("fy")),
      gst: url.searchParams.get("gst") ?? undefined,
      status: toStatusList(url.searchParams.get("status")),
      store_name: toList(url.searchParams.get("store")),
      supplier: toList(url.searchParams.get("supplier")),
    },
    { limit, page },
  );

  return NextResponse.json(result);
}

function toList(value: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toStatusList(value: string | null) {
  return toList(value)?.filter((item): item is "ACTIVE" | "INACTIVE" => item === "ACTIVE" || item === "INACTIVE");
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
      first_bill_date: payload.first_bill_date.trim(),
    },
    guard.session.user.email,
  );

  return NextResponse.json({ success: true });
}

function isPayload(value: unknown): value is {
  fy: string;
  gst_no: string;
  status?: string;
  store_name: string;
  supplier: string;
  first_bill_date: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{
    first_bill_date: string;
    fy: string;
    gst_no: string;
    store_name: string;
    supplier: string;
  }>;

  return Boolean(payload.fy && payload.gst_no && payload.store_name && payload.supplier && payload.first_bill_date);
}
