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

## Batch 2 — invoices #401-450

Same steps as above, using `sql/031_lady_j_invoices_401_450_import.sql`
instead of 027 (do the `SUPABASE_PROJECT` find/replace again, then paste
into the SQL Editor and run). 50 more scans, images already in
`public/lady-j-invoices/401.webp` … `450.webp`.

Two flagged on import instead of silently "fixed":
- **#415** (Andre Life Style Clothing, Box Board) — qty 100 × unit price
  29.50 should total 2,950, but the paper invoice was written up as
  29,500.00. Imported as `match_status = 'MISMATCH'` with the written
  total kept as-is — check the scan and correct by hand once you know
  which number was the typo.
- **#416** (Rowan Men's Shorts, 1494 @ 690) — crossed out "Cancelled" on
  the paper invoice. Imported as `status = 'void'`, zero amounts, no
  scanned image, so the numbering sequence stays intact without it
  showing up as real revenue anywhere.

## Uploading future batches yourself (no chat needed)

`/accounting/lady-j-invoices/upload` is a standalone page (open it in its
own tab from the **+ Upload New Invoices** button on the Lady J list) for
attaching new scans to invoices that are already in the system but don't
have a photo yet — built for exactly this workflow so the next 200 don't
need to go through an AI chat session.

- **Left, larger panel** — every invoice missing a scan (`image_url is
  null`), pulled live from Supabase.
- **Right panel** — drop a batch of scanned images (or click to pick
  several at once). Each one is best-effort OCR'd against just its
  top-right corner (where the printed invoice # sits) to suggest a match;
  if it finds one, a one-click **"Attach to #___"** button appears. OCR is
  purely a speed convenience — it fails silently and often on messy
  handwriting/scans, which is fine, since every image is also directly
  draggable from the right panel onto the correct row on the left to
  attach it manually.
- Attaching uploads straight to the `lady-j-invoices` Storage bucket and
  sets `invoices.image_url` from the browser, the same way the existing
  **Attach/Replace Image** button on the invoice edit page already does
  (`components/InvoiceImagePanel.tsx`) — no server route, no secret, no
  extra setup needed. This only *attaches images to existing rows*; it
  doesn't create new invoice records or extract line-item data — those
  still need to exist in Supabase first (e.g. via a SQL import batch like
  031, or the normal invoice form).
- Once attached, each image gets a **View →** link that opens
  `/accounting/invoice?id=<uuid>` in a new tab — the existing edit-invoice
  page, full display, no popups.
