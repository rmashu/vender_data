import type { Ledger } from './ledger';

export function validateLedger(row: Ledger) {
  return Boolean(row.store_name && row.invoice_no && row.invoice_date);
}

