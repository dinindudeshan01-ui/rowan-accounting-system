-- ============================================================
-- ROLLBACK for 045: re-opens anonymous access exactly as it was before
-- the lock-down (no login needed). Use only if the site breaks after 045.
-- ============================================================
grant select, insert, update, delete on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;
grant execute on all functions in schema public to anon;

do $$
declare t record;
begin
  for t in
    select c.relname as name from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('drop policy if exists "(rollback) anon full access" on public.%I', t.name);
    execute format('create policy "(rollback) anon full access" on public.%I for all to anon using (true) with check (true)', t.name);
  end loop;
end $$;

drop policy if exists "(rollback) anon uploads invoice scans" on storage.objects;
create policy "(rollback) anon uploads invoice scans" on storage.objects
  for insert to anon with check (bucket_id = 'lady-j-invoices');
drop policy if exists "(rollback) anon replaces invoice scans" on storage.objects;
create policy "(rollback) anon replaces invoice scans" on storage.objects
  for update to anon using (bucket_id = 'lady-j-invoices') with check (bucket_id = 'lady-j-invoices');

notify pgrst, 'reload schema';
