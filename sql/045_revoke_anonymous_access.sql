-- ============================================================
-- STEP 4 of 4 — CLOSE THE DOOR. Run only AFTER you have deployed the new
-- site and confirmed all three logins work (admin, accountant, auditors).
--
-- Removes the temporary "no login" access (006 / 008 / 033). After this,
-- nobody can read or write anything without logging in with a role.
-- If something breaks, run 045_rollback_anonymous_access.sql.
-- ============================================================

-- 1. No table / sequence / function access for the anonymous role
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated;
-- app_role() is harmless to anon (returns null) but keep it callable
grant execute on function public.app_role() to anon;

-- Future tables/functions must not be open to anon by default either
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;

-- 2. Drop the temporary anonymous policies
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where 'anon' = any(roles)
      and (schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects' and cmd <> 'SELECT'))
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

notify pgrst, 'reload schema';
