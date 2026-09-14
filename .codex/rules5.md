# Update Notes 5

- Track updates after `rules4.md` here.
- Keep `rules.md` for stable long-term rules.
- Keep `rules2.md`, `rules3.md` and `rules4.md` as previous update logs.

## Current Updates

- Dashboard shell was updated to use full screen width instead of a capped `max-w-7xl` container.
- Main app wrapper now uses `min-h-screen w-full` with responsive padding for mobile, tablet and desktop.
- Header action buttons now wrap on smaller screens so they do not overflow.
- Dashboard workspace now uses a responsive grid with a fixed sidebar only on large screens.
- Dashboard content area now uses `min-w-0` so wide tables and cards do not break the layout.
- Sidebar is scrollable with viewport height limits on large screens.
- Sidebar buttons now take full width for cleaner click targets.

## Next Rules

- Keep dashboard pages responsive across mobile, tablet, laptop and large desktop screens.
- Avoid fixed page widths unless the user explicitly asks for a centered/narrow layout.
- Use `w-full`, `min-w-0`, responsive grid columns and `overflow-x-auto` for table-heavy panels.
- Use sticky sidebar only on large screens; mobile/tablet should stack naturally.
- Keep dashboard module clicks on the same page unless a module is a real navigation action.
- Do not remove existing MongoDB data-fetching logic while changing layout or style.
- `Work Area`, `Reports` and `Admin` sections should remain dropdown-style sidebar groups.
- `vendor_ledger` remains the database name and `vendor_ledgers` remains the saved ledger collection.
