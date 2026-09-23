import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listLedgerTrackers, saveLedgerTracker } from "@/backend/purchase/ledger-tracker-repository";

export async function GET(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);

  return NextResponse.json(
    await listLedgerTrackers({
      fy: url.searchParams.get("fy") ?? undefined,
      status: toStatus(url.searchParams.get("status")),
      store: url.searchParams.get("store") ?? undefined,
      supplier: url.searchParams.get("supplier") ?? undefined,
    }),
  );
}

function toStatus(value: string | null) {
  return value === "MATCHED" || value === "MISMATCH" || value === "PENDING"
    ? value
    : undefined;
}

export async function POST(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!isPayload(payload)) {
    return NextResponse.json(
      { error: "fy, store_name, supplier, ledger_received_till and ledger_matched_till are required" },
      { status: 400 },
    );
  }

  await saveLedgerTracker(
    {
      first_bill_date: payload.first_bill_date.trim(),
      fy: payload.fy.trim(),
      gst_no: payload.gst_no.trim().toUpperCase(),
      ledger_matched_till: payload.ledger_matched_till.trim(),
      ledger_received_till: payload.ledger_received_till.trim(),
      pending_from: payload.pending_from.trim(),
      pending_to: payload.pending_to.trim(),
      closing_balance: Number(payload.closing_balance ?? 0),
      remarks: payload.remarks?.trim() ?? "",
      status: payload.status === "MATCHED" ? "MATCHED" : "PENDING",
      store_name: payload.store_name.trim().toUpperCase(),
      supplier: payload.supplier.trim(),
    },
    guard.session.user.email,
  );

  return NextResponse.json({ success: true });
}

function isPayload(value: unknown): value is {
  first_bill_date: string;
  fy: string;
  gst_no: string;
  ledger_matched_till: string;
  ledger_received_till: string;
  pending_from: string;
  pending_to: string;
  closing_balance?: number | string;
  remarks?: string;
  status?: string;
  store_name: string;
  supplier: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{
    first_bill_date: string;
    fy: string;
    gst_no: string;
    ledger_matched_till: string;
    ledger_received_till: string;
    pending_from: string;
    pending_to: string;
    closing_balance: number | string;
    store_name: string;
    supplier: string;
  }>;

  return Boolean(
    payload.fy &&
      payload.gst_no &&
      payload.store_name &&
      payload.supplier &&
      payload.ledger_received_till &&
      payload.ledger_matched_till &&
      payload.pending_from &&
      payload.pending_to,
  );
}
