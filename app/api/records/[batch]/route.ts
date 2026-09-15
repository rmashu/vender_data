import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { writeAuditLog } from "@/backend/audit/audit-repository";
import { getRecordDetail, updateLedgerEntry, type LedgerEntryUpdate } from "@/backend/records/record-repository";

type RouteContext = {
  params: Promise<{
    batch: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireApiPermission("ledger:view");

  if (!guard.ok) {
    return guard.response;
  }

  const { batch } = await context.params;
  const detail = await getRecordDetail(decodeURIComponent(batch), guard.session);

  if (!detail) {
    return NextResponse.json({ error: "Ledger batch not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireApiPermission("ledger:edit");

  if (!guard.ok) {
    return guard.response;
  }

  const { batch } = await context.params;
  const payload = (await request.json()) as Partial<LedgerEntryUpdate> & { ledgerId?: number };

  if (typeof payload.ledgerId !== "number") {
    return NextResponse.json({ error: "Ledger entry id is required" }, { status: 400 });
  }

  const entry: LedgerEntryUpdate = {
    credit: toAmount(payload.credit),
    debit: toAmount(payload.debit),
    invoice_date: String(payload.invoice_date ?? ""),
    invoice_no: String(payload.invoice_no ?? ""),
    pending_balance: toAmount(payload.pending_balance),
    status: String(payload.status ?? ""),
    vch_type: String(payload.vch_type ?? ""),
  };

  const updated = await updateLedgerEntry(decodeURIComponent(batch), payload.ledgerId, entry, guard.session);

  if (!updated) {
    return NextResponse.json({ error: "Ledger entry not found" }, { status: 404 });
  }

  await writeAuditLog({
    action: "LEDGER_ENTRY_UPDATED",
    actor: guard.session.user.email,
    metadata: { batchNumber: decodeURIComponent(batch), ledgerId: payload.ledgerId },
    status: "SUCCESS",
  });

  const detail = await getRecordDetail(decodeURIComponent(batch), guard.session);
  return NextResponse.json(detail);
}

function toAmount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
