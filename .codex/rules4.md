# Update Notes 4

- Track updates after `rules3.md` here.
- Keep `rules.md` for stable long-term rules.
- Keep `rules2.md` and `rules3.md` as previous update logs.

## Current Updates

- Work Area user panels were generated for `My Work`, `All Records`, `Reports`, `Analysis`, `Notifications` and `Profile`.
- Dashboard now passes the logged-in user into the same-page workspace so Profile and My Work can show user-specific details.
- Admin `Permissions` uses a custom dropdown list with checkboxes inside the dropdown, not an always-open checkbox grid.
- `Advanced Matrix View` was removed from the Permissions panel.
- Login/session permission checks now read saved MongoDB admin-config role permissions.
- ADMIN role keeps core admin permissions locked so `Roles` and `Permissions` controls cannot disappear.
- ADMIN core permissions cannot be removed from the Permissions UI.
- Existing Admin modules remain: `Users`, `Roles`, `Permissions`, `Data Management`, `Reports`, `Audit Logs` and `System Settings`.

## Next Rules

- Work Area clicks must update the right-side panel on the same dashboard page.
- Admin clicks must update the right-side panel on the same dashboard page.
- Do not navigate away for dashboard sidebar module clicks unless explicitly requested.
- Do not allow ADMIN to lose core permissions required to manage users, roles, permissions, masters, audit logs or settings.
- For permission editing, keep the dropdown-with-checkboxes UX.
- Roles panel includes clear edit controls for role name, description, reset and save.
- Users can be assigned multiple stores from Admin > Users.
- ADMIN always gets all stores; MANAGER, STAFF and VIEWER can receive multiple assigned stores.
- Reports now generate from MongoDB `vendor_ledgers` for Vendor, Store, Date Range, Pending Balance, Upload Batch and Credit Notes.
- Reports respect role-based store scope: ADMIN sees all stores, other roles see assigned stores only.
- Signup now returns clear existing-user messages for pending, active and inactive users instead of a generic database error.
- Reports now support vendor, store, status and date filters.
- All Records now loads searchable MongoDB batch records with role/store scope.
- My Work now loads the logged-in user's uploaded batches.
- Notifications now load recent audit-log activity.
- Analysis now loads dashboard KPI values from MongoDB.
- Ledger save API now rejects uploads for stores outside the user's assigned store scope.
- MongoDB database name is standardized to `vendor_ledger`; set `MONGODB_DB=vendor_ledger` in local and deploy environments.
