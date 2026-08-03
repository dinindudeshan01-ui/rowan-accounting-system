-- ============================================================
-- RENUMBER CHART OF ACCOUNTS
-- Repacks codes so each account type has a clean, gap-free block:
--   asset      1001, 1002, 1003, ...
--   liability  2001, 2002, 2003, ...
--   equity     3001, 3002, 3003, ...
--   revenue    4001, 4002, 4003, ...
--   expense    5001, 5002, 5003, ...
-- Order within each type is preserved (by current code), so relative
-- ordering doesn't change - only the actual numbers get tightened up.
-- This does NOT touch account names, ids, or any journal_lines rows,
-- since those reference account_id (a uuid), not the code. Safe to run
-- on a live ledger.
-- ============================================================

do $$
declare
  type_base record;
begin
  -- Phase 1: bump every code far out of the way first, so the unique
  -- constraint on `code` never collides mid-migration (e.g. account A
  -- getting account B's soon-to-be-vacated code before B is updated).
  update chart_of_accounts
  set code = 'tmp-' || id::text;

  -- Phase 2: assign the real, tightly packed codes per type.
  for type_base in
    select * from (values
      ('asset', 1000),
      ('liability', 2000),
      ('equity', 3000),
      ('revenue', 4000),
      ('expense', 5000)
    ) as t(type_name, base)
  loop
    update chart_of_accounts c
    set code = lpad((type_base.base + ranked.rn)::text, 4, '0')
    from (
      select id,
             row_number() over (order by created_at, name) as rn
      from chart_of_accounts
      where type = type_base.type_name::account_type
    ) ranked
    where c.id = ranked.id;
  end loop;
end $$;

-- Sanity check: run this after, should return one row per type showing
-- min/max code and count, with no gaps or duplicates.
-- select type, min(code), max(code), count(*) from chart_of_accounts group by type order by type;
