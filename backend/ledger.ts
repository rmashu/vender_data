export type Ledger = {
  id: number;
  store_name: string;
  invoice_no: string;
  invoice_date: string;
  vch_type: string;
  opening_balance: number;
  debit: number;
  credit: number;
  pending_balance: number;
  status: string;
};

export type LedgerPayload = {
  vendor_name: string;
  store_name: string;
  date_from: string;
  date_to: string;
  upload_timestamp: string;
  ledgers: Ledger[];
};

export function validateLedgerPayload(value: unknown): value is LedgerPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<LedgerPayload>;
  return (
    typeof payload.vendor_name === 'string' &&
    typeof payload.store_name === 'string' &&
    typeof payload.date_from === 'string' &&
    typeof payload.date_to === 'string' &&
    Array.isArray(payload.ledgers)
  );
}


