-- ============================================================
-- TEMPORARY: ANON ACCESS (NO LOGIN YET)
-- There is no login page/auth flow in the app yet, so every request
-- currently hits Supabase as the `anon` role, not `authenticated`.
-- Until a real login is built, this migration lets `anon` act like a
-- single accountant user so the app is usable end-to-end.
--
-- ⚠️ REMOVE THIS FILE'S EFFECTS once real auth/login is added:
--   - revoke these grants from anon
--   - drop the "(temp, no-login)" policies below
--   - rely on 003_roles_and_rls.sql's authenticated-only policies instead
-- ============================================================

-- Table-level grants (mirrors what 003 assumes `authenticated` has).
grant select, insert, update, delete on
  chart_of_accounts,
  journal_entries,
  journal_lines,
  audit_log,
  tax_settings
to anon;

grant usage on all sequences in schema public to anon;

-- Row-level policies: let anon do everything the accountant role could do.
create policy "(temp, no-login) anon manage accounts insert" on chart_of_accounts
  for insert to anon with check (true);

create policy "(temp, no-login) anon manage accounts update" on chart_of_accounts
  for update to anon using (true);

create policy "(temp, no-login) anon reads accounts" on chart_of_accounts
  for select to anon using (true);

create policy "(temp, no-login) anon manage entries" on journal_entries
  for all to anon using (true) with check (true);

create policy "(temp, no-login) anon manage lines" on journal_lines
  for all to anon using (true) with check (true);

create policy "(temp, no-login) anon reads audit log" on audit_log
  for select to anon using (true);

create policy "(temp, no-login) anon manage tax settings" on tax_settings
  for all to anon using (true) with check (true);
