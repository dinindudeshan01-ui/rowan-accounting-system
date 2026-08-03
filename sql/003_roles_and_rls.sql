-- ============================================================
-- ROLES + TIGHTENED RLS
-- Replaces the "any authenticated user can do anything" baseline
-- from 001 with role-aware policies. Run this after 001 and 002.
-- ============================================================

create type user_role as enum ('staff', 'accountant', 'admin');

create table user_roles (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     user_role not null default 'staff',
  full_name text,
  created_at timestamptz not null default now()
);

alter table user_roles enable row level security;

create policy "users read own role" on user_roles
  for select using (auth.uid() = user_id);

create policy "admins manage roles" on user_roles
  for all using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );

-- Helper: current user's role, used inside policies below
create or replace function current_user_role()
returns user_role as $$
  select role from user_roles where user_id = auth.uid();
$$ language sql stable security definer;

-- ---------- Drop the permissive baseline policies from 001 ----------
drop policy if exists "authenticated read/write" on chart_of_accounts;
drop policy if exists "authenticated read/write" on journal_entries;
drop policy if exists "authenticated read/write" on journal_lines;
drop policy if exists "authenticated read" on audit_log;
drop policy if exists "authenticated read/write" on tax_settings;

-- ---------- chart_of_accounts: everyone reads, only accountant/admin edits ----------
create policy "everyone reads accounts" on chart_of_accounts
  for select using (auth.role() = 'authenticated');

create policy "accountant+ manage accounts" on chart_of_accounts
  for insert with check (current_user_role() in ('accountant','admin'));

create policy "accountant+ update accounts" on chart_of_accounts
  for update using (current_user_role() in ('accountant','admin'));

-- ---------- journal_entries: staff can create/edit drafts, only accountant+ can post/void ----------
create policy "everyone reads entries" on journal_entries
  for select using (auth.role() = 'authenticated');

create policy "everyone creates draft entries" on journal_entries
  for insert with check (status = 'draft');

create policy "owner edits own drafts" on journal_entries
  for update using (
    status = 'draft' and created_by = auth.uid()
  ) with check (
    -- staff can only ever save as draft; posting/voiding requires accountant+
    (status = 'draft') or (current_user_role() in ('accountant','admin'))
  );

create policy "accountant+ can void" on journal_entries
  for update using (current_user_role() in ('accountant','admin'));

-- ---------- journal_lines: mirror entry-level access via the parent entry ----------
create policy "everyone reads lines" on journal_lines
  for select using (auth.role() = 'authenticated');

create policy "insert lines for own draft entries" on journal_lines
  for insert with check (
    exists (
      select 1 from journal_entries je
      where je.id = entry_id and je.status = 'draft'
    )
  );

create policy "edit lines on draft entries only" on journal_lines
  for update using (
    exists (
      select 1 from journal_entries je
      where je.id = entry_id and je.status = 'draft'
    )
  );

create policy "delete lines on draft entries only" on journal_lines
  for delete using (
    exists (
      select 1 from journal_entries je
      where je.id = entry_id and je.status = 'draft'
    )
  );

-- ---------- audit_log: read-only for everyone, no client writes at all ----------
-- (rows are written exclusively by the SECURITY DEFINER trigger in 001,
-- which bypasses RLS — so this table has no insert/update/delete policy
-- for any app role, meaning no one can tamper with history via the API.)
create policy "everyone reads audit log" on audit_log
  for select using (auth.role() = 'authenticated');

-- ---------- tax_settings: everyone reads, only admin updates ----------
create policy "everyone reads tax settings" on tax_settings
  for select using (auth.role() = 'authenticated');

create policy "admin updates tax settings" on tax_settings
  for update using (current_user_role() = 'admin');

-- ---------- Seed yourself as admin ----------
-- Run this manually after you sign up your first user, replacing the UUID
-- with your actual auth.users id (find it in Supabase Auth > Users):
--
-- insert into user_roles (user_id, role, full_name)
-- values ('00000000-0000-0000-0000-000000000000', 'admin', 'Dinindu')
-- on conflict (user_id) do update set role = 'admin';
