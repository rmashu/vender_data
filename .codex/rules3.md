# Update Notes 3

- Track the next scene-by-scene updates here after `rules2.md`.
- Keep `rules.md` for stable long-term rules.
- Keep `rules2.md` as the previous update log.

## Current Updates

- Ledger save requires a successful CSV upload before saving.
- `Save to database` is disabled until CSV rows are imported.
- Upload success no longer shows an `Imported rows` message.
- Save success shows only the generated batch number.
- Batch number format is `STORE-VENDOR-DATE-UNIQUEID`.
- Batch number is saved in MongoDB field `batch_number`.
- Store name is saved at batch level as `store_name` and also mapped onto each ledger row.
- Admin users panel added at `/admin/users`.
- Admin users panel supports pending approval, role assignment, inactive and reactivate actions.
- Admin section uses a sidebar-style navigation list in the users panel.
- Admin users sidebar items are real links to their module pages.
- User statuses from Mongo are normalized to avoid quoted status values breaking actions.
- Dashboard now uses a left sidebar with Work Area links and an Admin dropdown based on permissions.
- Added guarded placeholder pages so every dashboard sidebar click has a valid response.
- Dashboard sidebar clicks update the right-side response panel on the same page instead of navigating.
- Embedded admin Users view hides its inner admin sidebar to avoid mixed duplicate sidebars.
- Dashboard sidebar state now uses unique section and permission keys so duplicate titles like `Reports` do not conflict.
- Added same-page admin panels for Roles, Permissions, Data Management, Reports, Audit Logs and System Settings.
- Admin panels now include edit-style controls for roles, permissions, master data, reports and system settings.
- Current admin control UI prepares changes; database persistence APIs should be added per module before production save.
- Admin config persistence APIs added for roles, permissions, master data and settings.
- Admin dashboard controls now save to MongoDB-backed admin config endpoints.
- Audit logs added for user approval, user status changes, ledger batch saves and admin config changes.
- Database index helper added for users, ledger batches, vendor/store/date queries, audit logs and admin config.
- Signup now hashes and stores user passwords; login verifies stored password hash before demo fallback.
- Admin users panel includes reset password support for old or locked users.
- Permissions admin panel now uses a custom dropdown list with checkbox selection inside the dropdown.
- Login/session permission checks now read MongoDB admin-config role permissions, not only static seed permissions.
- Work Area now has same-page user panels for My Work, All Records, Reports, Analysis, Notifications and Profile.
- ADMIN role now keeps core admin permissions locked so Roles and Permissions controls cannot disappear.
