-- ============================================================
-- BALANCE SHEET — as-of a given date
-- Assets/Liabilities/Equity balances = all posted activity from the
-- beginning of the ledger through p_as_of. Retained earnings for the
-- current fiscal year (P&L not yet closed to equity) is folded into
-- Equity as a synthetic "Retained Earnings (Current Year)" line so the
-- sheet balances, same convention most small-business tools use.
-- ============================================================
create or replace function get_balance_sheet(p_as_of date)
returns table (
  account_type account_type,
  subtype text,
  account_code text,
  account_name text,
  amount numeric
) as $$
  select
    ca.type,
    ca.subtype,
    ca.code,
    ca.name,
    case
      when ca.type = 'asset' then sum(jl.debit - jl.credit)
      else sum(jl.credit - jl.debit) -- liability & equity are credit-normal
    end as amount
  from journal_lines jl
  join journal_entries je on je.id = jl.entry_id
  join chart_of_accounts ca on ca.id = jl.account_id
  where je.status = 'posted'
    and je.entry_date <= p_as_of
    and ca.type in ('asset', 'liability', 'equity')
  group by ca.type, ca.subtype, ca.code, ca.name

  union all

  -- Synthetic retained-earnings line: net P&L from the start of the ledger
  -- through p_as_of, so Assets = Liabilities + Equity holds even before a
  -- formal year-end closing entry has been posted.
  select
    'equity'::account_type,
    'Retained Earnings',
    '3900',
    'Retained Earnings (Current Year)',
    coalesce(sum(case when ca2.type = 'revenue' then jl2.credit - jl2.debit else -(jl2.debit - jl2.credit) end), 0)
  from journal_lines jl2
  join journal_entries je2 on je2.id = jl2.entry_id
  join chart_of_accounts ca2 on ca2.id = jl2.account_id
  where je2.status = 'posted'
    and je2.entry_date <= p_as_of
    and ca2.type in ('revenue', 'expense')

  order by 1, 3;
$$ language sql stable;

grant execute on function get_balance_sheet(date) to authenticated, anon;
