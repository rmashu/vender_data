import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/backend/auth/api-guard';
import { writeAuditLog } from '@/backend/audit/audit-repository';
import { validateLedgerPayload } from '@/backend/ledger';
import { saveVendorLedger } from '@/backend/ledger-repository';
import { canAccessStore } from '@/backend/records/record-repository';

export async function POST(request: Request) {
  const guard = await requireApiPermission('ledger:create');

  if (!guard.ok) {
    return guard.response;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!validateLedgerPayload(payload)) {
    return NextResponse.json({ error: 'Invalid ledger payload' }, { status: 400 });
  }

  if (!canAccessStore(guard.session, payload.store_name)) {
    return NextResponse.json({ error: 'You are not allowed to upload this store ledger' }, { status: 403 });
  }

  try {
    const saved = await saveVendorLedger(payload, guard.session.user.email);
    await writeAuditLog({
      action: 'LEDGER_BATCH_SAVED',
      actor: guard.session.user.email,
      metadata: { batchNumber: saved.batchNumber, count: saved.count },
      status: 'SUCCESS',
    });
    return NextResponse.json({ success: true, id: saved.id, batchNumber: saved.batchNumber, count: saved.count });
  } catch {
    await writeAuditLog({
      action: 'LEDGER_BATCH_SAVED',
      actor: guard.session.user.email,
      status: 'FAILED',
    });
    return NextResponse.json({ error: 'Unable to save ledger to database' }, { status: 500 });
  }
}
