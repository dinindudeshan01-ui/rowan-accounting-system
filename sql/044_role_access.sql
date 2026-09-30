-- ============================================================
-- STEP 3 of 4 — role-based access (ADDITIVE, safe before deploy).
-- Gives logged-in users access by role. Does NOT remove the old open
-- anonymous access yet (that is step 4), so the current site keeps working.
--
--   admin, accountant → read + write everything
--   auditor           → read everything, write NOTHING
--
-- Two independent layers block auditors from writing:
--   1. Row-level security: write policies only allow admin/accountant.
--   2. A trigger on every table: catches writes made through the
--      database functions (post invoice, pay bills, ...), which run with
--      elevated rights and would otherwise bypass RLS.
-- Safe to run more than once.
-- Tables created LATER need this re-run to get the same protection.
-- ============================================================

-- Current user's role as text (null if not logged in / no role assigned)
create or replace function app_role()
returns text as $$
  select role::text from public.user_roles where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

grant execute on function app_role() to authenticated, anon;

-- Blocks any write by a logged-in user who is not admin/accountant.
-- (SQL editor / service role have no auth.uid(), so they are unaffected.)
create or replace function enforce_read_only()
returns trigger as $$
begin
  if auth.uid() is not null and coalesce(app_role(), 'none') not in ('admin', 'accountant') then
    raise exception 'Read-only account: you can view data but not change it.'
      using errcode = '42501';
  end if;
  return null;
end;
$$ language plpgsql stable security definer set search_path = public;

do $$
declare
  t record;
begin
  for t in
    select c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'user_roles'
  loop
    execute format('alter table public.%I enable row level security', t.name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t.name);

    execute format('drop policy if exists "rowan read (any role)" on public.%I', t.name);
    execute format('create policy "rowan read (any role)" on public.%I for select to authenticated using (app_role() is not null)', t.name);

    execute format('drop policy if exists "rowan insert (admin/accountant)" on public.%I', t.name);
    execute format('create policy "rowan insert (admin/accountant)" on public.%I for insert to authenticated with check (app_role() in (''admin'', ''accountant''))', t.name);

    execute format('drop policy if exists "rowan update (admin/accountant)" on public.%I', t.name);
    execute format('create policy "rowan update (admin/accountant)" on public.%I for update to authenticated using (app_role() in (''admin'', ''accountant'')) with check (app_role() in (''admin'', ''accountant''))', t.name);

    execute format('drop policy if exists "rowan delete (admin/accountant)" on public.%I', t.name);
    execute format('create policy "rowan delete (admin/accountant)" on public.%I for delete to authenticated using (app_role() in (''admin'', ''accountant''))', t.name);

    execute format('drop trigger if exists zz_enforce_read_only on public.%I', t.name);
    execute format('create trigger zz_enforce_read_only before insert or update or delete on public.%I for each statement execute function enforce_read_only()', t.name);
  end loop;
end $$;

-- user_roles: everyone reads their own row; only admin manages roles.
alter table user_roles enable row level security;
drop policy if exists "users read own role" on user_roles;
create policy "users read own role" on user_roles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "admins manage roles" on user_roles;
create policy "admins manage roles" on user_roles for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
grant select, insert, update, delete on user_roles to authenticated;

grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Invoice scan uploads (storage): only admin/accountant may add or replace.
drop policy if exists "authenticated uploads invoice scans" on storage.objects;
create policy "authenticated uploads invoice scans" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lady-j-invoices' and public.app_role() in ('admin', 'accountant'));

drop policy if exists "authenticated replaces invoice scans" on storage.objects;
create policy "authenticated replaces invoice scans" on storage.objects
  for update to authenticated
  using (bucket_id = 'lady-j-invoices' and public.app_role() in ('admin', 'accountant'))
  with check (bucket_id = 'lady-j-invoices' and public.app_role() in ('admin', 'accountant'));

notify pgrst, 'reload schema';
