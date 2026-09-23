# Update Notes 7

- Track updates after `rules6.md` here.
- Keep older rule files as history, do not rewrite previous update logs unless asked.

## Current Updates

- Purchase Master now supports paginated loading instead of requiring a manual `Show Data` button.
- Purchase Master default page size is 50 rows.
- Purchase Master filters are kept inside a right-side drawer.
- Purchase Master filter options should stay unique for FY, store and supplier.
- Purchase Master filter values should be normalized before querying to avoid space/case mismatch issues.
- Purchase Master includes `first_bill_date` as master data.
- Ledger Tracker was added as a second tab under Purchase Master.
- Ledger Tracker saves workflow data into MongoDB collection `ledger_tracker`.
- Ledger Tracker fields include FY, store, supplier, GST number, first bill date, ledger received till, ledger matched till, pending from, pending to, status and remarks.
- Ledger Tracker should use Purchase Master or Vendor Ledger source data for FY/store/supplier/GST/first bill date selection.
- Ledger Tracker calculates pending period from matched/received dates.
- Ledger Tracker status should be `MATCHED` when matched till is greater than or equal to received till, otherwise `PENDING`.

## Next Rules

- Keep `purchase_master` for master data only.
- Keep `ledger_tracker` for date/status workflow tracking.
- Do not duplicate tracker workflow fields inside `purchase_master` unless explicitly requested.
- Prefer reusable filter components when adding more Purchase Master filters.
- Do not show filters directly on the front UI when a drawer is already used.
- Keep dropdown options unique and user-friendly.
- Keep API filters compatible with single-value dropdowns and future multi-value query params.
- Use MongoDB `vendor_ledgers` or `purchase_master` as the source for tracker dropdown data depending on the selected business flow.
- Run `pnpm typecheck` after TypeScript or API changes.

## Latest Updates

- Ledger Tracker filter bar should show only FY, Store, Supplier, Status and `Load Tracker`.
- Ledger Tracker manual save form is no longer needed for normal flow because tracker data syncs from vendor ledger upload.
- Ledger Tracker table columns now include `Closing Balance`.
- Ledger Tracker pending display should combine `pending_from` and `pending_to` into one `Pending Period` column.
- `pending_to` should represent the current date for open pending periods, not only the last vendor ledger date.
- Closing balance should come from the real vendor ledger closing value.
- For tracker sync, closing balance must use the original uploaded ledger row order's last row, not date-sorted last row.
- CSV import should preserve `closing_balance` from headers like `Closing Balance`, `Balance(Rs.)`, `Balance` and `Balance Amount`.
- Old MongoDB uploads may not contain `closing_balance`; re-upload or backfill is required for previous batches.
- `Vendor Ledger Details` can show full party ledger rows; tracker row click can later open those related details.

