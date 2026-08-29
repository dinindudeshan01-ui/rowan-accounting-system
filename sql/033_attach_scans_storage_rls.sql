-- ============================================================
-- FIX: RLS was blocking uploads from the Attach Invoice Scans page.
--
-- sql/026 only ever added a SELECT (public read) policy on
-- storage.objects for the 'lady-j-invoices' bucket, because at the
-- time uploads were meant to happen via a trusted service-role
-- script (scripts/upload-lady-j-images.js), not from the browser.
--
-- The attach-scans page now uploads directly from the browser as
-- the `anon` role (this app has no login yet — see
-- sql/006_temp_anon_access.sql for the same pattern applied to
-- other tables), so it needs its own insert/update policy here.
--
-- ⚠️ Remove alongside 006/008's anon policies once real auth exists.
-- ============================================================

drop policy if exists "(temp, no-login) anon uploads invoice scans" on storage.objects;
create policy "(temp, no-login) anon uploads invoice scans" on storage.objects
  for insert to anon
  with check (bucket_id = 'lady-j-invoices');

drop policy if exists "(temp, no-login) anon replaces invoice scans" on storage.objects;
create policy "(temp, no-login) anon replaces invoice scans" on storage.objects
  for update to anon
  using (bucket_id = 'lady-j-invoices')
  with check (bucket_id = 'lady-j-invoices');

-- authenticated gets the same, for whenever real login lands
drop policy if exists "authenticated uploads invoice scans" on storage.objects;
create policy "authenticated uploads invoice scans" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lady-j-invoices');

drop policy if exists "authenticated replaces invoice scans" on storage.objects;
create policy "authenticated replaces invoice scans" on storage.objects
  for update to authenticated
  using (bucket_id = 'lady-j-invoices')
  with check (bucket_id = 'lady-j-invoices');
