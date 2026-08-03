-- ============================================================
-- PROFIT & LOSS — single function, called by every period option
-- Sri Lanka fiscal year = Apr 1 - Mar 31
-- ============================================================
create or replace function get_pl(p_start date, p_end date)
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
      when ca.type = 'revenue' then sum(jl.credit - jl.debit)
      else sum(jl.debit - jl.credit)
    end as amount
  from journal_lines jl
  join journal_entries je on je.id = jl.entry_id
  join chart_of_accounts ca on ca.id = jl.account_id
  where je.status = 'posted'
    and je.entry_date between p_start and p_end
    and ca.type in ('revenue','expense')
  group by ca.type, ca.subtype, ca.code, ca.name
  order by ca.type, ca.code;
$$ language sql stable;

create or replace function get_fiscal_year_bounds(p_offset int default 0)
returns table (fy_start date, fy_end date) as $$
declare
  v_today date := current_date;
  v_fy_start_year int;
begin
  if extract(month from v_today) >= 4 then
    v_fy_start_year := extract(year from v_today)::int;
  else
    v_fy_start_year := extract(year from v_today)::int - 1;
  end if;
  v_fy_start_year := v_fy_start_year + p_offset;
  fy_start := make_date(v_fy_start_year, 4, 1);
  fy_end := make_date(v_fy_start_year + 1, 3, 31);
  return next;
end;
$$ language plpgsql stable;
