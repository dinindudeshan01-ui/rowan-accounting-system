-- ============================================================
-- ROWAN ACCOUNTING — CORE SCHEMA
-- Chart of Accounts + Journal Engine + Audit Log + Tax Settings
-- Everything (invoices, expenses, inventory, payroll) posts
-- through journal_entries/journal_lines. Never write directly
-- to a "balance" column anywhere — always derive from lines.
-- ============================================================

create extension if not exists "pgcrypto";

create type account_type as enum ('asset','liability','equity','revenue','expense');
create type je_status as enum ('draft','posted','void');
create type je_source as enum ('manual','invoice','expense','payroll','inventory_adjustment','opening_balance');

-- ---------- CHART OF ACCOUNTS ----------
create table chart_of_accounts (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  type         account_type not null,
  subtype      text,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into chart_of_accounts (code, name, type, subtype) values
('1000','Cash and Bank','asset','Current Asset'),
('1100','Accounts Receivable','asset','Current Asset'),
('1200','Inventory','asset','Current Asset'),
('2000','Accounts Payable','liability','Current Liability'),
('2100','VAT Payable','liability','Tax Liability'),
('2200','SSCL Payable','liability','Tax Liability'),
('2300','APIT Payable','liability','Tax Liability'),
('2400','EPF Payable','liability','Tax Liability'),
('2500','ETF Payable','liability','Tax Liability'),
('3000','Owner''s Equity','equity','Equity'),
('4000','Sales Revenue','revenue','Operating Revenue'),
('5000','Cost of Goods Sold','expense','COGS'),
('6000','Salary Expense','expense','Operating Expense'),
('6100','Rent Expense','expense','Operating Expense'),
('6200','Utilities Expense','expense','Operating Expense'),
('6300','Office Supplies','expense','Operating Expense'),
('6900','General & Admin Expense','expense','Operating Expense');

-- ---------- JOURNAL ENTRIES ----------
create table journal_entries (
  id            uuid primary key default gen_random_uuid(),
  entry_number  text not null unique,
  entry_date    date not null default current_date,
  memo          text,
  reference     text,
  status        je_status not null default 'draft',
  source_type   je_source not null default 'manual',
  source_id     uuid,
  created_by    uuid references auth.users(id),
  created_by_name text,
  posted_at     timestamptz,
  is_recurring  boolean not null default false,
  recurring_interval text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table journal_lines (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references journal_entries(id) on delete cascade,
  line_no       int not null,
  account_id    uuid not null references chart_of_accounts(id),
  debit         numeric(14,2) not null default 0,
  credit        numeric(14,2) not null default 0,
  description   text,
  customer_id   uuid,
  vendor_id     uuid,
  class         text,
  location      text,
  attachment_url text,
  constraint chk_single_side check (
    (debit >= 0 and credit >= 0) and not (debit > 0 and credit > 0)
  )
);

create index idx_journal_lines_entry on journal_lines(entry_id);
create index idx_journal_lines_account on journal_lines(account_id);
create index idx_journal_entries_date on journal_entries(entry_date);
create index idx_journal_entries_status on journal_entries(status);

create sequence je_number_seq start 1;
create or replace function set_je_number()
returns trigger as $$
begin
  if new.entry_number is null or new.entry_number = '' then
    new.entry_number := 'JE-' || lpad(nextval('je_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_je_number
before insert on journal_entries
for each row execute function set_je_number();

create or replace function check_je_balanced()
returns trigger as $$
declare
  total_debit numeric(14,2);
  total_credit numeric(14,2);
begin
  if new.status = 'posted' then
    select coalesce(sum(debit),0), coalesce(sum(credit),0)
      into total_debit, total_credit
      from journal_lines where entry_id = new.id;

    if total_debit <> total_credit then
      raise exception 'Journal entry % is not balanced: debit % != credit %',
        new.entry_number, total_debit, total_credit;
    end if;
    if total_debit = 0 then
      raise exception 'Journal entry % has no amounts', new.entry_number;
    end if;
    new.posted_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_je_balance_check
before update on journal_entries
for each row execute function check_je_balanced();

-- ============================================================
-- AUDIT LOG — automatic, generic, applies to any tracked table
-- ============================================================
create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id),
  user_name    text,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid not null,
  entity_label text,
  changes      jsonb,
  created_at   timestamptz not null default now()
);

create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_user on audit_log(user_id);
create index idx_audit_created on audit_log(created_at desc);

create or replace function write_audit_log()
returns trigger as $$
declare
  v_user_id uuid;
  v_user_name text;
  v_label text;
  v_changes jsonb;
begin
  v_user_id := auth.uid();
  select raw_user_meta_data->>'full_name' into v_user_name
    from auth.users where id = v_user_id;

  if TG_TABLE_NAME = 'journal_entries' then
    v_label := coalesce(new.entry_number, old.entry_number);
  else
    v_label := coalesce(new.id::text, old.id::text);
  end if;

  if TG_OP = 'UPDATE' then
    select jsonb_object_agg(key, jsonb_build_object('old', old_val, 'new', new_val))
      into v_changes
      from (
        select key, to_jsonb(old) ->> key as old_val, to_jsonb(new) ->> key as new_val
        from jsonb_object_keys(to_jsonb(new)) as key
      ) diff
      where old_val is distinct from new_val;
  end if;

  insert into audit_log (user_id, user_name, action, entity_type, entity_id, entity_label, changes)
  values (
    v_user_id, coalesce(v_user_name, 'System'),
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    v_label,
    v_changes
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_audit_journal_entries
after insert or update or delete on journal_entries
for each row execute function write_audit_log();

create trigger trg_audit_journal_lines
after insert or update or delete on journal_lines
for each row execute function write_audit_log();

create trigger trg_audit_chart_of_accounts
after insert or update or delete on chart_of_accounts
for each row execute function write_audit_log();

-- ============================================================
-- TAX SETTINGS — one row per business, drives invoice calc
-- ============================================================
create table tax_settings (
  id                 uuid primary key default gen_random_uuid(),
  vat_registered     boolean not null default false,
  vat_rate           numeric(5,2) not null default 18.0,
  sscl_registered    boolean not null default false,
  sscl_rate          numeric(5,2) not null default 2.5,
  sscl_base_pct      numeric(5,2) not null default 85.0,
  sscl_threshold     numeric(14,2) not null default 9000000,
  updated_at         timestamptz not null default now()
);

insert into tax_settings (vat_registered, sscl_registered) values (false, false);

create trigger trg_audit_tax_settings
after update on tax_settings
for each row execute function write_audit_log();

create or replace view quarterly_turnover as
select coalesce(sum(jl.credit - jl.debit), 0) as turnover
from journal_lines jl
join journal_entries je on je.id = jl.entry_id
join chart_of_accounts ca on ca.id = jl.account_id
where ca.code = '4000'
  and je.status = 'posted'
  and je.entry_date >= (current_date - interval '3 months');

-- ============================================================
-- ROW LEVEL SECURITY — baseline (tightened further in 003)
-- ============================================================
alter table chart_of_accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table audit_log enable row level security;
alter table tax_settings enable row level security;

create policy "authenticated read/write" on chart_of_accounts for all using (auth.role() = 'authenticated');
create policy "authenticated read/write" on journal_entries for all using (auth.role() = 'authenticated');
create policy "authenticated read/write" on journal_lines for all using (auth.role() = 'authenticated');
create policy "authenticated read" on audit_log for select using (auth.role() = 'authenticated');
create policy "authenticated read/write" on tax_settings for all using (auth.role() = 'authenticated');
