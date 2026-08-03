# Daily Output — Google Sheet ↔ Rowan sync

Floor staff enter daily output in a normal Google Sheet. No login, no app screen —
just fill in columns. It syncs to Supabase automatically, and a Summary tab syncs
back so they can see totals without opening Rowan at all.

## 1. Run the SQL migration
`sql/025_department_output.sql` — run it in Supabase (SQL editor or CLI), after
024_payroll.sql. It's been tested end-to-end locally: good rows sync, a typo'd
department or style number fails that one row with a clear message (not the
whole batch), and re-syncing an edited row updates it instead of duplicating.

## 2. Create the Google Sheet
One spreadsheet, two tabs:

**Tab "Daily Output"** — row 1 headers, exactly this order:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Department | Style No | Quantity | Notes | Entered By | Status | Row Key |

Leave Status and Row Key blank for new rows — the script fills them in.

**Tab "Summary"** — leave blank, the script writes into it.

## 3. Add the script
Extensions → Apps Script → delete the placeholder → paste in `Code.gs` from
this folder → save.

## 4. Set your Supabase credentials
In the Apps Script editor: Project Settings (gear icon, left sidebar) → Script
Properties → Add property, twice:

| Property | Value | Where to find it |
|---|---|---|
| `SUPABASE_URL` | your project URL | `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | your anon key | `.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## 5. First run
Reload the spreadsheet tab. A **Rowan Sync** menu appears next to Help.

1. Rowan Sync → **Refresh Dropdowns** — authorize when Google prompts (first
   time only). This pulls your current departments and active styles into
   dropdown lists on the Department/Style No columns, so staff can't mistype
   a name that won't match.
2. Rowan Sync → **Enable Auto-Sync (every 10 min)** — from then on it syncs
   itself. "Sync Now" is there too for an immediate push.

That's the whole setup. From here, floor staff just open the Sheet and type.

## Day to day
- Fill Date, pick Department from the dropdown, optionally pick a Style No,
  type Quantity, Notes, Entered By. Leave Status/Row Key blank.
- Within 10 minutes, Status turns green: "Synced Jul 20, 14:32".
- A typo or bad entry turns Status red with the exact reason, e.g.
  `Error: Unknown department: Sewng` — fix the cell, clear Status, it retries
  on the next sync.
- **Made a mistake after it synced?** Edit the row, then delete the contents
  of the Status cell. Next sync updates that same record — it will not create
  a duplicate, because Row Key stays the same for that row forever.
- New department or style added in Rowan? Run **Refresh Dropdowns** again (or
  just wait — do it manually whenever the list changes; it's not on the timer
  by design, since it rarely changes).

## What this feeds
`department_output` is Phase 2 of the labour costing plan — department +
style output, by day. Phase 3 (actual cost per unit, department/style-wise,
using this output against actual payroll CTC) reads directly from this table.

## Security note
This uses the same "anon" access the app itself currently runs on, since
Rowan has no login yet. Once you add real authentication, swap this script
to call a dedicated Supabase Edge Function instead of holding the anon key
in Script Properties — the anon key currently has broad access by design
(matches `sql/006_temp_anon_access.sql`), which is fine for now but shouldn't
carry over once real users and real security exist.
