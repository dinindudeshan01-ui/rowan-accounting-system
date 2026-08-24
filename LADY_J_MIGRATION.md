# Lady J scanned invoices → Supabase migration

Moves the 200 scanned Lady J invoices (previously bundled as static JSON in
`lib/data/lady-j-raw-invoices.json`) into the real `invoices` / `invoice_lines`
tables in Supabase, and their 200 `.webp` photos into Supabase Storage.

Run these in order.

## 1. Schema

Supabase Dashboard → SQL Editor → paste and run:

```
sql/026_lady_j_scan_columns.sql
```

Adds `source`, `legacy_id`, `match_status`, `image_url` columns to `invoices`,
plus a public `lady-j-invoices` Storage bucket.

## 2. Data import

Before running, open `sql/027_lady_j_invoices_import.sql` and replace every
occurrence of `SUPABASE_PROJECT` with your actual project ref (the `xxxx` in
`https://xxxx.supabase.co`). Find & replace in your editor, or:

```bash
sed -i 's/SUPABASE_PROJECT/your-project-ref/g' sql/027_lady_j_invoices_import.sql
```

Then paste the whole file into the SQL Editor and run it. It inserts 200
invoices and 236 invoice lines. Safe to re-run — it upserts on `legacy_id`.

## 3. Image upload

This needs your **service role key** (not the anon key), so it has to run
locally — never paste that key into a chat or commit it.

```bash
npm install @supabase/supabase-js
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/upload-lady-j-images.js
```

Uploads all 200 files from `public/lady-j-invoices/*.webp` to the
`lady-j-invoices` Storage bucket, overwriting on re-run.

## 4. Verify

- `/accounting/lady-j-invoices` — should list 200 scanned invoices loaded live
  from Supabase, each with its photo on the right.
- `/accounting/invoices` — should now also show the Lady J invoices mixed in
  with regular ones (source is not filtered out here), each with a **View**
  button that opens the attached scan.

## Notes

- `lib/data/lady-j-raw-invoices.json` and `lady-j-attachments.json` are kept
  in the repo as a historical backup of the original data, but the app no
  longer reads them — `lib/ladyJInvoices.ts` now queries Supabase directly.
- If you'd rather the plain `/accounting/invoices` list only show real
  invoices (not the Lady J scans), filter `.eq('source', 'manual')` there —
  ask and I can wire in a toggle.
