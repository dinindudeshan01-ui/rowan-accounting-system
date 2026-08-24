-- ============================================================
-- LADY J SCANNED INVOICES — fold into the existing invoices table
-- These are historical scanned invoices (from physical paper records),
-- not created through the normal invoice form. We reuse invoices /
-- invoice_lines rather than a separate table, distinguished by
-- `source`. `legacy_id` keeps the original numeric id from the
-- scanned-invoice spreadsheet so re-running the import script is safe
-- (upsert on legacy_id instead of duplicating rows). `match_status`
-- keeps the OK / MISMATCH / N/A verification flag from the original
-- reconciliation. `image_url` points at the Supabase Storage object
-- for the scanned photo.
-- ============================================================

alter table invoices
  add column if not exists source text not null default 'manual',
  add column if not exists legacy_id integer,
  add column if not exists match_status text,
  add column if not exists image_url text;

alter table invoices
  drop constraint if exists chk_invoices_source;
alter table invoices
  add constraint chk_invoices_source check (source in ('manual', 'lady_j_scan'));

alter table invoices
  drop constraint if exists chk_invoices_match_status;
alter table invoices
  add constraint chk_invoices_match_status check (match_status is null or match_status in ('OK', 'MISMATCH', 'N/A'));

create unique index if not exists idx_invoices_legacy_id on invoices (legacy_id) where legacy_id is not null;
create index if not exists idx_invoices_source on invoices (source);

-- Storage bucket for the scanned invoice photos (public read, so <img>
-- tags can hit the public URL directly without a signed-URL round trip).
insert into storage.buckets (id, name, public)
values ('lady-j-invoices', 'lady-j-invoices', true)
on conflict (id) do nothing;

drop policy if exists "public read lady-j invoice images" on storage.objects;
create policy "public read lady-j invoice images" on storage.objects
  for select using (bucket_id = 'lady-j-invoices');

-- Uploads happen via the service-role key from a trusted script (see
-- scripts/upload-lady-j-images.js), so no anon/authenticated insert
-- policy is needed on storage.objects for this bucket.
