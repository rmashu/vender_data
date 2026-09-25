# Update Notes 8

- Track updates after `rules7.md` here.
- Keep older rule files as history, do not rewrite previous update logs unless asked.

## Current Updates

- Admin sidebar should keep `Permissions` only; separate `Roles` menu is not needed in the sidebar.
- `Admin Reports` duplicate menu was removed; normal `Reports` remains available.
- `My Work` auto-loads uploaded batches on page open, so `View My Batches` button is not needed.
- `Download CSV Format` button downloads the vendor ledger CSV template from `My Work`.
- `Upload Ledger CSV` and `Download CSV Format` buttons should use the same default button style unless the user asks otherwise.
- Data Management saves vendor/store master edits into MongoDB `admin_config`, not into `backend/masters/master-data.ts`.
- `backend/masters/master-data.ts` is only a default/static fallback list.
- Data Management should show clear feedback after adding vendor/store and after saving: added name, store name and save success.
- Data Management preview should show latest added vendor/store values so users know what they just added.

## Dropdown Source Rules

- Vendor Ledger form Store/Vendor dropdowns should include values from both MongoDB `admin_config` and `purchase_master`.
- Purchase Master dropdowns should continue using `purchase_master` rows plus fallback static values.
- Use `/api/purchase-master/options` for Vendor Ledger form dropdown options.
- `/api/purchase-master/options` should allow sessions with `ledger:view`, `ledger:create`, or `masters:manage`.
- Dropdown values should be unique using `Set`; avoid duplicate values in UI.
- Data Management additions should appear in Vendor Ledger dropdown after save and refresh/reload.

## Vendor Ledger Form UI

- `components/ledger/ledger-form.tsx` should show labels above controls:
  - Store Name
  - Vendor Name
  - From Date
  - To Date
  - CSV File
- Do not put label text inside `SelectTrigger`; labels must be above the control to avoid mixing with selected value.
- CSV upload control should visually match normal input/select borders, not dashed border unless specifically requested.
- If the user asks to align `Choose CSV` left, change the upload label class from `justify-center` to `justify-start`.

## Database Notes

- Direct MongoDB admin config location:
  - DB: `vendor_ledger`
  - Collection: `admin_config`
  - Document key: `{ key: "main" }`
  - Fields: `vendors`, `stores`
- Use `$addToSet` when adding vendor/store directly in MongoDB to avoid duplicates.
- Example recent test values added directly to DB: vendor `ROHIT`, store `PPT`.

## Validation

- Run `pnpm.cmd typecheck` after TypeScript/API/UI changes.
- If UI does not reflect latest changes, restart dev server or hard refresh browser because Next dev cache may show old UI.

## Docker And GitHub Actions

- Project root is `C:\newproject\next-app`; Docker files must stay at the same level as `package.json`.
- Docker build files added/used:
  - `Dockerfile`
  - `.dockerignore`
  - `docker-compose.yml`
  - `.github/workflows/docker-build.yml`
- Next.js Docker production build requires `output: "standalone"` in `next.config.ts`.
- Dockerfile should use pnpm because the project has `pnpm-lock.yaml`.
- `.dockerignore` should exclude `.env` and `.env*` so secrets are not copied into Docker images.
- GitHub Actions workflow builds Docker image on pull requests and pushes.
- On `main` branch push, GitHub Actions pushes the image to GitHub Container Registry (`ghcr.io/${{ github.repository }}`).
- GitHub Actions build/push does not make the app live by itself; a server/hosting target is still needed for deployment.
- After adding Docker/GitHub Actions files, run `pnpm.cmd typecheck`, then commit and push to trigger Actions.
