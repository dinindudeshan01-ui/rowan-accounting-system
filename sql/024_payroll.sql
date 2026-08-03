-- ============================================================
-- PAYROLL — departments, employees, allowances/deductions,
-- APIT/EPF/ETF calculation engine, and GL posting.
--
-- Nothing here is hardcoded. Every rate, every allowance, every
-- deduction, and the entire APIT tax table live in editable
-- tables (payroll_settings, allowance_types, deduction_types,
-- apit_tax_slabs) so an accountant can update them the moment
-- the IRD changes a rate, with zero code changes.
--
-- CTC vs net pay — the distinction this schema is built around:
--   Net pay  = what the employee receives (gross - EPF employee
--              - APIT - other deductions). This is NOT the cost
--              to the business.
--   CTC      = gross earnings + EPF employer + ETF employer.
--              This is the real cost to the business, and it's
--              the number the (future) labour costing engine
--              must divide by output — not net pay.
--
-- Double-entry on posting (see post_payroll_period below):
--   Dr [department wage account]   gross_earnings   (by dept)
--   Dr EPF - Employer Contribution epf_employer
--   Dr ETF - Employer Contribution etf_employer
--   Cr EPF Payable                 epf_employee + epf_employer
--   Cr ETF Payable                 etf_employer
--   Cr APIT Payable                apit_amount
--   Cr [custom deduction accounts] other_deductions (by account)
--   Cr Salaries Payable             net_pay
-- This balances by construction because net_pay is derived as
-- gross - epf_employee - apit - other_deductions — no plug needed.
-- ============================================================

-- ---------- tag the existing liability accounts from 001 with
-- system_role, since 007's renumbering means their codes can no
-- longer be relied on to look them up ----------
update chart_of_accounts set system_role = 'epf_payable' where name = 'EPF Payable' and system_role is null;
update chart_of_accounts set system_role = 'etf_payable' where name = 'ETF Payable' and system_role is null;
update chart_of_accounts set system_role = 'apit_payable' where name = 'APIT Payable' and system_role is null;

-- ---------- new GL accounts this module needs ----------
insert into chart_of_accounts (code, name, type, subtype, system_role) values
  ('5204', 'EPF - Employer Contribution', 'expense', 'Direct Labor', 'epf_employer_expense'),
  ('5205', 'ETF - Employer Contribution', 'expense', 'Direct Labor', 'etf_employer_expense')
on conflict (code) do nothing;

insert into chart_of_accounts (code, name, type, subtype, system_role) values
  ('2600', 'Salaries Payable', 'liability', 'Current Liability', 'salaries_payable'),
  ('2350', 'Other Payroll Deductions Payable', 'liability', 'Current Liability', 'other_payroll_deductions_payable')
on conflict (code) do nothing;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
create table departments (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null unique,
  default_wage_account_id uuid references chart_of_accounts(id),
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_departments_touch before update on departments
  for each row execute function touch_updated_at();
create trigger trg_audit_departments after insert or update or delete on departments
  for each row execute function write_audit_log();

-- Seed the three departments the manufacturing accounts already imply.
insert into departments (name, default_wage_account_id)
select 'Cutting', id from chart_of_accounts where code = '5201'
on conflict (name) do nothing;
insert into departments (name, default_wage_account_id)
select 'Sewing / Swing', id from chart_of_accounts where code = '5202'
on conflict (name) do nothing;
insert into departments (name, default_wage_account_id)
select 'Finishing & Packing', id from chart_of_accounts where code = '5203'
on conflict (name) do nothing;

-- ============================================================
-- EMPLOYEES
-- ============================================================
create sequence employee_no_seq start 1;

create table employees (
  id             uuid primary key default gen_random_uuid(),
  employee_no    text not null unique,
  name           text not null,
  department_id  uuid references departments(id) on delete set null,
  designation    text,
  basic_salary   numeric(14,2) not null default 0,
  epf_no         text,
  join_date      date,
  status         text not null default 'active' check (status in ('active','inactive')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_employees_department on employees (department_id);
create index idx_employees_status on employees (status);

create or replace function assign_employee_no()
returns trigger as $$
begin
  if new.employee_no is null or new.employee_no = '' then
    new.employee_no := 'EMP-' || lpad(nextval('employee_no_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_employee_no before insert on employees
  for each row execute function assign_employee_no();
create trigger trg_employees_touch before update on employees
  for each row execute function touch_updated_at();
create trigger trg_audit_employees after insert or update or delete on employees
  for each row execute function write_audit_log();

-- ============================================================
-- ALLOWANCE / DEDUCTION TYPES — the editable master lists.
-- Accountants add/remove these freely; nothing is hardcoded.
-- ============================================================
create table allowance_types (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null unique,
  is_epf_qualifying  boolean not null default false,
  is_taxable         boolean not null default true,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

create table deduction_types (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  is_statutory   boolean not null default false, -- true = EPF/APIT, system-computed, cannot be deleted
  account_id     uuid references chart_of_accounts(id), -- where a custom deduction posts on credit; null falls back to "Other Payroll Deductions Payable"
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Starter set — editable/removable like everything else here, not load-bearing.
insert into allowance_types (name, is_epf_qualifying, is_taxable) values
  ('Cost of Living Allowance', true, true),
  ('Attendance Allowance', true, true),
  ('Transport Allowance', false, true),
  ('Budgetary Relief Allowance', true, true)
on conflict (name) do nothing;

create trigger trg_audit_allowance_types after insert or update or delete on allowance_types
  for each row execute function write_audit_log();
create trigger trg_audit_deduction_types after insert or update or delete on deduction_types
  for each row execute function write_audit_log();

-- ---------- recurring lines per employee ----------
create table employee_allowances (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references employees(id) on delete cascade,
  allowance_type_id uuid not null references allowance_types(id),
  amount            numeric(14,2) not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (employee_id, allowance_type_id)
);

create table employee_deductions (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references employees(id) on delete cascade,
  deduction_type_id uuid not null references deduction_types(id),
  amount            numeric(14,2) not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (employee_id, deduction_type_id)
);

create index idx_emp_allowances_employee on employee_allowances (employee_id);
create index idx_emp_deductions_employee on employee_deductions (employee_id);

-- ============================================================
-- PAYROLL SETTINGS — the company-wide rates. Singleton, fully
-- editable. apit_enabled is the on/off switch requested: flip it
-- off and every payslip skips tax withholding without touching
-- any other logic.
-- ============================================================
create table payroll_settings (
  id                      int primary key default 1,
  epf_employee_pct        numeric(5,2) not null default 8.00,
  epf_employer_pct        numeric(5,2) not null default 12.00,
  etf_employer_pct        numeric(5,2) not null default 3.00,
  apit_enabled            boolean not null default false,
  standard_working_days   numeric(5,2) not null default 26,
  ot_multiplier           numeric(5,2) not null default 1.50,
  updated_at              timestamptz not null default now(),
  constraint payroll_settings_singleton check (id = 1)
);

insert into payroll_settings (id) values (1) on conflict (id) do nothing;

create trigger trg_payroll_settings_touch before update on payroll_settings
  for each row execute function touch_updated_at();
-- no write_audit_log trigger here: payroll_settings.id is int (singleton,
-- same pattern as costing_settings), but audit_log.entity_id is uuid —
-- the generic trigger would fail casting id on every update.

-- ============================================================
-- APIT TAX SLABS — the editable, versioned tax table.
-- Multiple rows share one effective_from date and together form
-- one progressive table (band_from -> band_to at rate_pct).
-- The LAST band for a version has band_to = null (open-ended).
-- Seeded with IRD Table 01, Y/A 2025/2026 (effective 1 Apr 2025) —
-- verify against the current official table before relying on it,
-- and add a new effective_from version whenever the IRD updates it
-- rather than editing this one (keeps old payslips recalculating
-- correctly against the table that was actually live then).
-- ============================================================
create table apit_tax_slabs (
  id             uuid primary key default gen_random_uuid(),
  effective_from date not null,
  band_from      numeric(14,2) not null,
  band_to        numeric(14,2), -- null = open-ended top band
  rate_pct       numeric(5,2) not null,
  sort_order     int not null,
  created_at     timestamptz not null default now()
);

create index idx_apit_slabs_effective on apit_tax_slabs (effective_from);

insert into apit_tax_slabs (effective_from, band_from, band_to, rate_pct, sort_order) values
  ('2025-04-01',      0, 150000, 0,  1),
  ('2025-04-01', 150000, 233333, 6,  2),
  ('2025-04-01', 233333, 275000, 18, 3),
  ('2025-04-01', 275000, 316667, 24, 4),
  ('2025-04-01', 316667, 358333, 30, 5),
  ('2025-04-01', 358333, null,   36, 6);

-- ============================================================
-- PAYROLL PERIODS + ENTRIES + LINES
-- ============================================================
create table payroll_periods (
  id             uuid primary key default gen_random_uuid(),
  period_year    int not null,
  period_month   int not null check (period_month between 1 and 12),
  label          text not null,
  status         text not null default 'draft' check (status in ('draft','finalized','posted')),
  posted_entry_id uuid references journal_entries(id),
  created_at     timestamptz not null default now(),
  finalized_at   timestamptz,
  posted_at      timestamptz,
  unique (period_year, period_month)
);

create table payroll_entries (
  id                      uuid primary key default gen_random_uuid(),
  period_id               uuid not null references payroll_periods(id) on delete cascade,
  employee_id             uuid not null references employees(id),
  department_id           uuid references departments(id), -- snapshot at run time
  basic_salary            numeric(14,2) not null default 0, -- snapshot
  no_pay_days             numeric(5,2) not null default 0,
  ot_hours                numeric(6,2) not null default 0,
  ot_amount               numeric(14,2) not null default 0,
  gross_earnings          numeric(14,2) not null default 0,
  epf_qualifying_earnings numeric(14,2) not null default 0,
  epf_employee            numeric(14,2) not null default 0,
  epf_employer            numeric(14,2) not null default 0,
  etf_employer            numeric(14,2) not null default 0,
  taxable_earnings        numeric(14,2) not null default 0,
  apit_amount             numeric(14,2) not null default 0,
  other_deductions_total  numeric(14,2) not null default 0,
  net_pay                 numeric(14,2) not null default 0,
  ctc                     numeric(14,2) not null default 0, -- gross + epf_employer + etf_employer: THE cost figure for costing
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (period_id, employee_id)
);

create index idx_payroll_entries_period on payroll_entries (period_id);
create index idx_payroll_entries_department on payroll_entries (department_id);

create table payroll_entry_lines (
  id               uuid primary key default gen_random_uuid(),
  payroll_entry_id uuid not null references payroll_entries(id) on delete cascade,
  line_type        text not null check (line_type in ('allowance','deduction')),
  name             text not null, -- snapshotted label, survives allowance/deduction_type edits later
  amount           numeric(14,2) not null default 0,
  is_epf_qualifying boolean not null default false,
  is_taxable        boolean not null default true,
  account_id        uuid references chart_of_accounts(id), -- only set for custom (non-statutory) deduction lines
  created_at        timestamptz not null default now()
);

create index idx_payroll_entry_lines_entry on payroll_entry_lines (payroll_entry_id);

create trigger trg_payroll_entries_touch before update on payroll_entries
  for each row execute function touch_updated_at();
create trigger trg_audit_payroll_periods after insert or update or delete on payroll_periods
  for each row execute function write_audit_log();
create trigger trg_audit_payroll_entries after insert or update or delete on payroll_entries
  for each row execute function write_audit_log();

-- ============================================================
-- CALCULATION ENGINE
-- ============================================================

-- ---------- calc_apit: progressive tax across whichever slab
-- version was effective on p_as_of. Returns 0 if apit_enabled is
-- off or no slabs are configured for that date. ----------
create or replace function calc_apit(p_taxable_earnings numeric, p_as_of date)
returns numeric as $$
declare
  v_enabled  boolean;
  v_version  date;
  v_band     record;
  v_tax      numeric := 0;
  v_in_band  numeric;
begin
  select apit_enabled into v_enabled from payroll_settings where id = 1;
  if not coalesce(v_enabled, false) then
    return 0;
  end if;

  select max(effective_from) into v_version
  from apit_tax_slabs where effective_from <= p_as_of;

  if v_version is null or p_taxable_earnings <= 0 then
    return 0;
  end if;

  for v_band in
    select band_from, band_to, rate_pct
    from apit_tax_slabs
    where effective_from = v_version
    order by sort_order
  loop
    if p_taxable_earnings <= v_band.band_from then
      exit;
    end if;
    v_in_band := least(p_taxable_earnings, coalesce(v_band.band_to, p_taxable_earnings)) - v_band.band_from;
    v_tax := v_tax + (v_in_band * v_band.rate_pct / 100.0);
  end loop;

  return round(v_tax, 2);
end;
$$ language plpgsql stable;

-- ---------- recompute_payroll_entry: the single source of truth
-- for every number on a payslip. Re-run any time lines, no_pay_days,
-- or ot_hours change. Blocked once the period is finalized/posted
-- so a locked payroll can't silently drift. ----------
create or replace function recompute_payroll_entry(p_entry_id uuid)
returns void as $$
declare
  v_entry    payroll_entries%rowtype;
  v_period   payroll_periods%rowtype;
  v_settings payroll_settings%rowtype;
  v_daily_rate numeric;
  v_hourly_rate numeric;
  v_no_pay_amount numeric;
  v_allowance_total numeric := 0;
  v_epf_qualifying_allowances numeric := 0;
  v_taxable_allowances numeric := 0;
  v_custom_deductions numeric := 0;
  v_period_end date;
begin
  select * into v_entry from payroll_entries where id = p_entry_id;
  if not found then raise exception 'Payroll entry not found'; end if;

  select * into v_period from payroll_periods where id = v_entry.period_id;
  if v_period.status <> 'draft' then
    raise exception 'Period % is % — cannot recompute a locked payroll', v_period.label, v_period.status;
  end if;

  select * into v_settings from payroll_settings where id = 1;

  v_daily_rate := case when v_settings.standard_working_days > 0
    then v_entry.basic_salary / v_settings.standard_working_days else 0 end;
  v_hourly_rate := v_daily_rate / 8.0;
  v_no_pay_amount := v_no_pay_amount_calc(v_entry.no_pay_days, v_daily_rate);

  select
    coalesce(sum(amount), 0),
    coalesce(sum(amount) filter (where is_epf_qualifying), 0),
    coalesce(sum(amount) filter (where is_taxable), 0)
    into v_allowance_total, v_epf_qualifying_allowances, v_taxable_allowances
    from payroll_entry_lines where payroll_entry_id = p_entry_id and line_type = 'allowance';

  select coalesce(sum(amount), 0) into v_custom_deductions
    from payroll_entry_lines where payroll_entry_id = p_entry_id and line_type = 'deduction';

  v_entry.ot_amount := round(v_entry.ot_hours * v_hourly_rate * v_settings.ot_multiplier, 2);
  v_entry.gross_earnings := round(v_entry.basic_salary - v_no_pay_amount + v_entry.ot_amount + v_allowance_total, 2);
  v_entry.epf_qualifying_earnings := round(v_entry.basic_salary - v_no_pay_amount + v_epf_qualifying_allowances, 2);
  v_entry.epf_employee := round(v_entry.epf_qualifying_earnings * v_settings.epf_employee_pct / 100.0, 2);
  v_entry.epf_employer := round(v_entry.epf_qualifying_earnings * v_settings.epf_employer_pct / 100.0, 2);
  v_entry.etf_employer := round(v_entry.epf_qualifying_earnings * v_settings.etf_employer_pct / 100.0, 2);
  v_entry.taxable_earnings := round(v_entry.basic_salary - v_no_pay_amount + v_entry.ot_amount + v_taxable_allowances, 2);

  v_period_end := make_date(v_period.period_year, v_period.period_month, 1);
  v_entry.apit_amount := calc_apit(v_entry.taxable_earnings, v_period_end);

  v_entry.other_deductions_total := v_custom_deductions;
  v_entry.net_pay := round(v_entry.gross_earnings - v_entry.epf_employee - v_entry.apit_amount - v_custom_deductions, 2);
  v_entry.ctc := round(v_entry.gross_earnings + v_entry.epf_employer + v_entry.etf_employer, 2);

  update payroll_entries set
    ot_amount = v_entry.ot_amount,
    gross_earnings = v_entry.gross_earnings,
    epf_qualifying_earnings = v_entry.epf_qualifying_earnings,
    epf_employee = v_entry.epf_employee,
    epf_employer = v_entry.epf_employer,
    etf_employer = v_entry.etf_employer,
    taxable_earnings = v_entry.taxable_earnings,
    apit_amount = v_entry.apit_amount,
    other_deductions_total = v_entry.other_deductions_total,
    net_pay = v_entry.net_pay,
    ctc = v_entry.ctc
  where id = p_entry_id;
end;
$$ language plpgsql;

-- small helper kept separate so the no-pay formula is defined once
create or replace function v_no_pay_amount_calc(p_days numeric, p_daily_rate numeric)
returns numeric as $$
  select round(coalesce(p_days, 0) * coalesce(p_daily_rate, 0), 2);
$$ language sql immutable;

-- ---------- generate_payroll_entry: pulls an employee's current
-- recurring allowances/deductions into a fresh draft entry for a
-- period, snapshotting names/flags so later master-data edits never
-- rewrite history. ----------
create or replace function generate_payroll_entry(p_period_id uuid, p_employee_id uuid)
returns uuid as $$
declare
  v_employee employees%rowtype;
  v_entry_id uuid;
begin
  select * into v_employee from employees where id = p_employee_id;
  if not found then raise exception 'Employee not found'; end if;

  insert into payroll_entries (period_id, employee_id, department_id, basic_salary)
  values (p_period_id, p_employee_id, v_employee.department_id, v_employee.basic_salary)
  on conflict (period_id, employee_id) do update set basic_salary = excluded.basic_salary
  returning id into v_entry_id;

  delete from payroll_entry_lines where payroll_entry_id = v_entry_id;

  insert into payroll_entry_lines (payroll_entry_id, line_type, name, amount, is_epf_qualifying, is_taxable)
  select v_entry_id, 'allowance', at.name, ea.amount, at.is_epf_qualifying, at.is_taxable
  from employee_allowances ea
  join allowance_types at on at.id = ea.allowance_type_id
  where ea.employee_id = p_employee_id and ea.is_active and at.is_active;

  insert into payroll_entry_lines (payroll_entry_id, line_type, name, amount, account_id)
  select v_entry_id, 'deduction', dt.name, ed.amount, dt.account_id
  from employee_deductions ed
  join deduction_types dt on dt.id = ed.deduction_type_id
  where ed.employee_id = p_employee_id and ed.is_active and dt.is_active and not dt.is_statutory;

  perform recompute_payroll_entry(v_entry_id);
  return v_entry_id;
end;
$$ language plpgsql;

-- ---------- run_payroll_period: (re)generates entries for every
-- active employee not already in this period. Safe to re-run. ----------
create or replace function run_payroll_period(p_period_id uuid)
returns int as $$
declare
  v_count int := 0;
  v_emp record;
begin
  for v_emp in select id from employees where status = 'active'
  loop
    perform generate_payroll_entry(p_period_id, v_emp.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$ language plpgsql;

-- ---------- finalize_payroll_period: locks entries from further
-- editing (recompute_payroll_entry refuses once status <> draft). ----------
create or replace function finalize_payroll_period(p_period_id uuid)
returns void as $$
begin
  update payroll_periods set status = 'finalized', finalized_at = now()
  where id = p_period_id and status = 'draft';
  if not found then
    raise exception 'Period not found or not in draft status';
  end if;
end;
$$ language plpgsql;

create or replace function reopen_payroll_period(p_period_id uuid)
returns void as $$
begin
  update payroll_periods set status = 'draft', finalized_at = null
  where id = p_period_id and status = 'finalized';
  if not found then
    raise exception 'Period not found or already posted (posted periods cannot be reopened — void the GL entry first)';
  end if;
end;
$$ language plpgsql;

-- ============================================================
-- post_payroll_period — the atomic GL posting described at the
-- top of this file. One balanced journal entry per period,
-- grouped by department wage account and by custom-deduction
-- account, so the ledger shows exactly where labour cost landed.
-- ============================================================
create or replace function post_payroll_period(p_period_id uuid, p_created_by_name text)
returns text as $$
declare
  v_period       payroll_periods%rowtype;
  v_entry_id     uuid;
  v_line_no      int := 1;
  v_epf_payable  uuid;
  v_etf_payable  uuid;
  v_apit_payable uuid;
  v_salaries_payable uuid;
  v_other_ded_fallback uuid;
  v_epf_emp_exp  uuid;
  v_etf_emp_exp  uuid;
  v_dept         record;
  v_ded_acct     record;
  v_total_epf_ee numeric; v_total_epf_er numeric; v_total_etf numeric;
  v_total_apit   numeric; v_total_net    numeric;
begin
  select * into v_period from payroll_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_period.status <> 'finalized' then
    raise exception 'Finalize the period before posting';
  end if;
  if not exists (select 1 from payroll_entries where period_id = p_period_id) then
    raise exception 'No payroll entries in this period';
  end if;
  if exists (select 1 from payroll_entries where period_id = p_period_id and department_id is null) then
    raise exception 'One or more employees have no department assigned — assign a department before posting';
  end if;

  select id into v_epf_payable  from chart_of_accounts where system_role = 'epf_payable';
  select id into v_etf_payable  from chart_of_accounts where system_role = 'etf_payable';
  select id into v_apit_payable from chart_of_accounts where system_role = 'apit_payable';
  select id into v_salaries_payable from chart_of_accounts where system_role = 'salaries_payable';
  select id into v_other_ded_fallback from chart_of_accounts where system_role = 'other_payroll_deductions_payable';
  select id into v_epf_emp_exp from chart_of_accounts where system_role = 'epf_employer_expense';
  select id into v_etf_emp_exp from chart_of_accounts where system_role = 'etf_employer_expense';

  if v_epf_payable is null or v_etf_payable is null or v_apit_payable is null
     or v_salaries_payable is null or v_epf_emp_exp is null or v_etf_emp_exp is null then
    raise exception 'One or more payroll GL accounts are missing — check chart of accounts setup';
  end if;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (make_date(v_period.period_year, v_period.period_month, 1), 'Payroll ' || v_period.label, 'draft', 'payroll', p_period_id, p_created_by_name)
  returning id into v_entry_id;

  -- Dr each department's wage account for its gross earnings
  for v_dept in
    select d.name, d.default_wage_account_id as account_id, sum(pe.gross_earnings) as amt
    from payroll_entries pe
    join departments d on d.id = pe.department_id
    where pe.period_id = p_period_id
    group by d.name, d.default_wage_account_id
  loop
    if v_dept.account_id is null then
      raise exception 'Department % has no wage account mapped — set one before posting', v_dept.name;
    end if;
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description, class)
    values (v_entry_id, v_line_no, v_dept.account_id, v_dept.amt, 0, v_period.label || ' gross wages', v_dept.name);
    v_line_no := v_line_no + 1;
  end loop;

  select coalesce(sum(epf_employee),0), coalesce(sum(epf_employer),0), coalesce(sum(etf_employer),0),
         coalesce(sum(apit_amount),0), coalesce(sum(net_pay),0)
    into v_total_epf_ee, v_total_epf_er, v_total_etf, v_total_apit, v_total_net
    from payroll_entries where period_id = p_period_id;

  -- Dr EPF/ETF employer expense (the real cost of employer contributions)
  if v_total_epf_er > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_epf_emp_exp, v_total_epf_er, 0, v_period.label || ' EPF employer contribution');
    v_line_no := v_line_no + 1;
  end if;
  if v_total_etf > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_etf_emp_exp, v_total_etf, 0, v_period.label || ' ETF employer contribution');
    v_line_no := v_line_no + 1;
  end if;

  -- Cr EPF Payable (employee + employer share), ETF Payable, APIT Payable
  if (v_total_epf_ee + v_total_epf_er) > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_epf_payable, 0, v_total_epf_ee + v_total_epf_er, v_period.label || ' EPF payable');
    v_line_no := v_line_no + 1;
  end if;
  if v_total_etf > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_etf_payable, 0, v_total_etf, v_period.label || ' ETF payable');
    v_line_no := v_line_no + 1;
  end if;
  if v_total_apit > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_apit_payable, 0, v_total_apit, v_period.label || ' APIT payable');
    v_line_no := v_line_no + 1;
  end if;

  -- Cr each custom deduction's mapped account (loans, advances, etc.)
  for v_ded_acct in
    select coalesce(pel.account_id, v_other_ded_fallback) as account_id, sum(pel.amount) as amt
    from payroll_entry_lines pel
    join payroll_entries pe on pe.id = pel.payroll_entry_id
    where pe.period_id = p_period_id and pel.line_type = 'deduction'
    group by coalesce(pel.account_id, v_other_ded_fallback)
  loop
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_ded_acct.account_id, 0, v_ded_acct.amt, v_period.label || ' payroll deductions');
    v_line_no := v_line_no + 1;
  end loop;

  -- Cr Salaries Payable for net pay owed to employees
  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_salaries_payable, 0, v_total_net, v_period.label || ' net salaries payable');

  update journal_entries set status = 'posted' where id = v_entry_id;
  update payroll_periods set status = 'posted', posted_at = now(), posted_entry_id = v_entry_id where id = p_period_id;

  return v_period.label;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RLS — mirrors the rest of the app: authenticated read/write,
-- plus the same temporary anon-access policy used everywhere else
-- while the app has no login yet.
-- ============================================================
alter table departments enable row level security;
alter table employees enable row level security;
alter table allowance_types enable row level security;
alter table deduction_types enable row level security;
alter table employee_allowances enable row level security;
alter table employee_deductions enable row level security;
alter table payroll_settings enable row level security;
alter table apit_tax_slabs enable row level security;
alter table payroll_periods enable row level security;
alter table payroll_entries enable row level security;
alter table payroll_entry_lines enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['departments','employees','allowance_types','deduction_types',
    'employee_allowances','employee_deductions','payroll_settings','apit_tax_slabs',
    'payroll_periods','payroll_entries','payroll_entry_lines']
  loop
    execute format('create policy "authenticated read/write" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t);
    execute format('create policy "(temp, no-login) anon manages %I" on %I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;

grant select, insert, update, delete on
  departments, employees, allowance_types, deduction_types, employee_allowances,
  employee_deductions, payroll_settings, apit_tax_slabs, payroll_periods,
  payroll_entries, payroll_entry_lines
  to authenticated, anon;
grant usage, select on employee_no_seq to authenticated, anon;

grant execute on function calc_apit(numeric, date) to authenticated, anon;
grant execute on function recompute_payroll_entry(uuid) to authenticated, anon;
grant execute on function generate_payroll_entry(uuid, uuid) to authenticated, anon;
grant execute on function run_payroll_period(uuid) to authenticated, anon;
grant execute on function finalize_payroll_period(uuid) to authenticated, anon;
grant execute on function reopen_payroll_period(uuid) to authenticated, anon;
grant execute on function post_payroll_period(uuid, text) to authenticated, anon;

-- ============================================================
-- Fold payroll into the admin reset (014) — transactions only,
-- master data (employees, departments, settings, tax slabs) kept.
-- ============================================================
create or replace function reset_all_transactions()
returns void as $$
begin
  truncate table journal_lines, journal_entries, invoice_lines, invoices,
                 payment_allocations, payments, expense_lines, expenses,
                 payroll_entry_lines, payroll_entries, payroll_periods, audit_log;

  alter sequence je_number_seq restart with 1;
  alter sequence invoice_number_seq restart with 1;
  alter sequence payment_number_seq restart with 1;
  alter sequence expense_number_seq restart with 1;
end;
$$ language plpgsql security definer;
