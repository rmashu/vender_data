# Update Notes 6

- Track updates after `rules5.md` here.
- Keep `rules.md` for stable long-term rules.
- Keep `rules2.md`, `rules3.md`, `rules4.md` and `rules5.md` as previous update logs.

## Current Updates

- All Records rows are now clickable by batch number.
- Clicking a saved batch loads related ledger entries from MongoDB on the same dashboard page.
- Related ledger entries can be edited inline for invoice number, date, voucher type, debit, credit, pending balance and status.
- Ledger entry edits save through `/api/records/[batch]` with `ledger:edit` permission.
- Batch detail panel includes `Save All Changes` for bulk saving edited entries.
- Batch detail panel includes `Export Batch CSV`.
- Batch detail panel includes summary cards for entries, pending, partial, completed and pending amount.
- Ledger entry validation blocks missing invoice number, missing date and negative debit/credit/pending amounts.
- Analysis panel now generates real MongoDB reports using existing report APIs.
- Analysis includes filters for date range, vendor, store and status.
- Analysis includes KPI cards, top vendor pending chart, store pending chart and report tables.
- Login now uses hard redirect after successful cookie creation to avoid double-click login.
- Login email is normalized with trim/lowercase before auth.
- Login auth now fetches user and password hash in one MongoDB query.
- Admin config/role permission loading has a short cache for faster login/session checks.

## Next Rules

- Batch row click should always show related entries on the same page, not navigate away.
- Keep edit controls permission protected with `ledger:edit`.
- Keep viewer-style users read-only when edit permission is not available.
- Prefer bulk save for batch edits, but keep per-row save for quick correction.
- Keep audit logs for ledger entry edits.
- Keep Analysis reports based on MongoDB `vendor_ledgers`, not mock data.
- Keep Analysis filters consistent with Reports filters.
- For login performance, avoid duplicate MongoDB reads in the same request path.
- Clear admin config cache whenever roles, permissions, masters or settings are updated.


