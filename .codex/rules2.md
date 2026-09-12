# Update Notes

- Track new incremental decisions and recent changes here.
- Keep `rules.md` for stable long-term project rules only.
- Move anything from this file into `rules.md` only when it becomes a permanent project standard.

## Current Updates

- Added auth, role, permission, and demo session foundation.
- Added `/login` demo login page.
- Added `/dashboard` permission-based dashboard shell.
- Added API permission guard in `backend/auth/api-guard.ts`.
- Protected ledger import and ledger save APIs with `ledger:create`.
- Added real login route at `app/api/auth/login/route.ts`.
- Added logout route at `app/api/auth/logout/route.ts`.
- Session now uses an HTTP-only signed cookie.
- Auth env keys are documented in `.env.example`.
- Added `proxy.ts` to redirect unauthenticated protected pages to `/login`.
- Added shared authenticated shell in `components/app-shell.tsx`.
- Dashboard and ledger pages now use the shared app shell.
- Moved ledger work area to `/ledger`.
- Root `/` now redirects to `/dashboard`.
- Added MongoDB driver and database connection helper.
- Added Mongo-backed user repository with seed fallback.
- Added admin bootstrap API to create demo admin user in MongoDB.
- Ledger save API now persists batches to MongoDB collection `vendor_ledgers`.
- Restored and modernized `/login` page after it was accidentally commented out.
- Fixed signed session cookie parsing for email values that contain dots.
- Added auth flow documentation in `backend/auth/AUTH_FLOW.md`.
- Dashboard now redirects to `/login` when session is missing instead of rendering an unauthorized card.
- Added login page mode switch for Login and New User signup.
- Added `POST /api/auth/signup` for creating new users.
- New users now start as `PENDING` and cannot login until admin approval.
- Added admin approve API at `app/api/admin/users/approve/route.ts`.
- Ledger save keeps rows visible, shows saved batch id, and uses manual `Clear form`.
- `/ledger` now renders `LedgerWorkspace` so save/clear UX changes appear on the actual route.
- Ledger save resets form rows after success without showing success message or batch id.
- Ledger save now stores selected `store_name` at the batch level and maps selected store onto all rows.
- Ledger save now generates and stores a readable `batch_number` using store, vendor, date, and a short unique id.
- Upload success no longer shows `Imported rows` message; final batch number appears only after save.
- Save to database is disabled until a valid CSV upload succeeds.
