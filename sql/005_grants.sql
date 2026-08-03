-- ============================================================
-- BASELINE GRANTS
-- RLS policies (003_roles_and_rls.sql) control *which rows* a role can
-- touch, but Postgres separately requires a GRANT saying the role can
-- touch the table *at all*. Without this, every query fails with
-- "permission denied for table X" before RLS is even evaluated.
-- Run this once, after 001-004.
-- ============================================================

grant select, insert, update, delete on
  chart_of_accounts,
  journal_entries,
  journal_lines,
  audit_log,
  tax_settings,
  user_roles
to authenticated;

-- Needed so identity/serial columns (if any) can be advanced on insert.
grant usage on all sequences in schema public to authenticated;
