-- ============================================================
-- BANK OPERATIONS — the QuickBooks-style bank suite this app was
-- missing: Write Checks, Make Deposits, Pay Bills, and Bank
-- Reconciliation. Built on the same journal_entries/journal_lines
-- engine as everything else (012 invoices, 013 receive payments,
-- 015 expenses) — nothing here is a parallel ledger.
--
-- Design notes:
--   - Any chart_of_accounts row can be flagged is_bank_account so it
--     shows up in the bank pickers below. Multiple bank accounts are
--     supported (Cash, HNB, Sampath, etc.) — unlike system_role,
--     is_bank_account is NOT unique.
--   - Write Checks and Pay Bills both credit a bank account directly
--     — no "undeposited funds" clearing account, matching how
--     receive_payment() (013) already posts straight to the chosen
--     deposit account. Make Deposits exists for bank credits that
--     AREN'T a customer payment (capital injections, refunds,
--     misc./interest income) and everything else already covers the
--     rest — so this is deliberately the smaller of the four.
--   - Pay Bills is the gap flagged directly in 015_expenses.sql's
--     header comment: settling a 'bill'-type expense later.
--   - Reconciliation adds cleared/reconciliation_id onto
--     journal_lines itself (one flag on the existing ledger row)
--     rather than a shadow table, so every screen that already reads
--     journal_lines (account ledger, reports) sees cleared status
--     for free.
-- ============================================================

-- Run sql/035_bank_operations_enum.sql FIRST (its own SQL editor
-- execution) — Postgres refuses to use a new enum value in the same
-- transaction that adds it, so the je_source additions this file
-- depends on must be committed before this one runs.

-- ---------- shared: which accounts are bank accounts ----------
alter table chart_of_accounts add column if not exists is_bank_account boolean not null default false;
update chart_of_accounts set is_bank_account = true where name = 'Cash and Bank';

-- ============================================================
-- 1. WRITE CHECKS — Dr expense/other line(s) · Cr bank account
-- ============================================================
create sequence check_number_seq start 1001;

create or replace function next_check_number_preview()
returns text as $$
  select lpad((last_value + case when is_called then 1 else 0 end)::text, 4, '0')
  from check_number_seq;
$$ language sql stable;

create table checks (
  id                uuid primary key default gen_random_uuid(),
  check_number      text not null,
  check_date        date not null default current_date,
  bank_account_id   uuid not null references chart_of_accounts(id),
  payee_type        text not null check (payee_type in ('vendor','customer','other')),
  payee_vendor_id   uuid references vendors(id),
  payee_customer_id uuid references customers(id),
  payee_name        text,
  memo              text,
  print_later       boolean not null default false,
  total_amount      numeric(14,2) not null default 0,
  status            text not null default 'posted' check (status in ('posted','void')),
  posted_entry_id   uuid references journal_entries(id),
  created_by_name   text,
  created_at        timestamptz not null default now(),
  constraint check_payee_matches_type check (
    (payee_type = 'vendor' and payee_vendor_id is not null) or
    (payee_type = 'customer' and payee_customer_id is not null) or
    (payee_type = 'other' and payee_name is not null and payee_name <> '')
  )
);

create index idx_checks_bank_account on checks (bank_account_id);
create unique index idx_checks_bank_account_number on checks (bank_account_id, check_number) where status <> 'void';

create table check_lines (
  id          uuid primary key default gen_random_uuid(),
  check_id    uuid not null references checks(id) on delete cascade,
  line_no     int not null,
  account_id  uuid not null references chart_of_accounts(id),
  description text,
  amount      numeric(14,2) not null check (amount > 0)
);

create index idx_check_lines_check on check_lines (check_id);

create trigger trg_audit_checks after insert or update or delete on checks
  for each row execute function write_audit_log();

create or replace function write_check(
  p_check_date      date,
  p_bank_account_id uuid,
  p_check_number    text,
  p_payee_type      text,
  p_payee_vendor_id uuid,
  p_payee_customer_id uuid,
  p_payee_name      text,
  p_memo            text,
  p_print_later     boolean,
  p_created_by_name text,
  p_lines           jsonb
) returns text as $$
declare
  v_check_id uuid;
  v_total    numeric := 0;
  v_line     jsonb;
  v_line_no  int := 1;
  v_entry_id uuid;
  v_number   text;
begin
  select coalesce(sum((elem->>'amount')::numeric), 0) into v_total
  from jsonb_array_elements(p_lines) elem;

  if v_total <= 0 then
    raise exception 'Check must have at least one line with an amount greater than zero';
  end if;

  v_number := nullif(trim(p_check_number), '');
  if v_number is null then
    v_number := lpad(nextval('check_number_seq')::text, 4, '0');
  end if;

  insert into checks (
    check_number, check_date, bank_account_id, payee_type,
    payee_vendor_id, payee_customer_id, payee_name, memo,
    print_later, total_amount, created_by_name
  ) values (
    v_number, p_check_date, p_bank_account_id, p_payee_type,
    p_payee_vendor_id, p_payee_customer_id, p_payee_name, p_memo,
    p_print_later, v_total, p_created_by_name
  ) returning id into v_check_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into check_lines (check_id, line_no, account_id, description, amount)
    values (v_check_id, v_line_no, (v_line->>'account_id')::uuid, v_line->>'description', (v_line->>'amount')::numeric);
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (p_check_date, coalesce(p_memo, 'Check ' || v_number), 'draft', 'write_check', v_check_id, p_created_by_name)
  returning id into v_entry_id;

  v_line_no := 1;
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
    values (
      v_entry_id, v_line_no, (v_line->>'account_id')::uuid,
      case when p_payee_type = 'vendor' then p_payee_vendor_id else null end,
      (v_line->>'amount')::numeric, 0, coalesce(v_line->>'description', 'Check ' || v_number)
    );
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
  values (
    v_entry_id, v_line_no, p_bank_account_id,
    case when p_payee_type = 'vendor' then p_payee_vendor_id else null end,
    0, v_total, 'Check ' || v_number
  );

  update journal_entries set status = 'posted' where id = v_entry_id;
  update checks set posted_entry_id = v_entry_id where id = v_check_id;

  return v_number;
end;
$$ language plpgsql security definer;

create or replace function void_check(p_check_id uuid)
returns void as $$
declare
  v_check checks%rowtype;
  v_line  record;
  v_entry_id uuid;
  v_line_no int := 1;
begin
  select * into v_check from checks where id = p_check_id;
  if not found then
    raise exception 'Check not found';
  end if;
  if v_check.status = 'void' then
    return;
  end if;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (current_date, 'Void check ' || v_check.check_number, 'draft', 'write_check', v_check.id, v_check.created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_check.bank_account_id, v_check.total_amount, 0, 'Void check ' || v_check.check_number);
  v_line_no := v_line_no + 1;

  for v_line in select * from check_lines where check_id = p_check_id order by line_no
  loop
    insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
    values (
      v_entry_id, v_line_no, v_line.account_id,
      case when v_check.payee_type = 'vendor' then v_check.payee_vendor_id else null end,
      0, v_line.amount, 'Void check ' || v_check.check_number
    );
    v_line_no := v_line_no + 1;
  end loop;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update checks set status = 'void' where id = p_check_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 2. MAKE DEPOSITS — Dr bank account · Cr income/other line(s)
-- For bank credits that aren't a customer payment (013 already
-- covers those): capital injections, refunds, interest, misc income.
-- ============================================================
create sequence deposit_number_seq start 1;

create or replace function next_deposit_number_preview()
returns text as $$
  select 'DEP-' || lpad((last_value + case when is_called then 1 else 0 end)::text, 6, '0')
  from deposit_number_seq;
$$ language sql stable;

create table deposits (
  id              uuid primary key default gen_random_uuid(),
  deposit_number  text not null unique,
  deposit_date    date not null default current_date,
  bank_account_id uuid not null references chart_of_accounts(id),
  memo            text,
  total_amount    numeric(14,2) not null default 0,
  status          text not null default 'posted' check (status in ('posted','void')),
  posted_entry_id uuid references journal_entries(id),
  created_by_name text,
  created_at      timestamptz not null default now()
);

create index idx_deposits_bank_account on deposits (bank_account_id);

create or replace function assign_deposit_number()
returns trigger as $$
begin
  if new.deposit_number is null or new.deposit_number = '' then
    new.deposit_number := 'DEP-' || lpad(nextval('deposit_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_deposit_number
  before insert on deposits
  for each row execute function assign_deposit_number();

create table deposit_lines (
  id            uuid primary key default gen_random_uuid(),
  deposit_id    uuid not null references deposits(id) on delete cascade,
  line_no       int not null,
  account_id    uuid not null references chart_of_accounts(id),
  received_from text,
  description   text,
  amount        numeric(14,2) not null check (amount > 0)
);

create index idx_deposit_lines_deposit on deposit_lines (deposit_id);

create trigger trg_audit_deposits after insert or update or delete on deposits
  for each row execute function write_audit_log();

create or replace function make_deposit(
  p_deposit_date    date,
  p_bank_account_id uuid,
  p_memo            text,
  p_created_by_name text,
  p_lines           jsonb
) returns text as $$
declare
  v_deposit_id uuid;
  v_total      numeric := 0;
  v_line       jsonb;
  v_line_no    int := 1;
  v_entry_id   uuid;
  v_number     text;
begin
  select coalesce(sum((elem->>'amount')::numeric), 0) into v_total
  from jsonb_array_elements(p_lines) elem;

  if v_total <= 0 then
    raise exception 'Deposit must have at least one line with an amount greater than zero';
  end if;

  insert into deposits (deposit_date, bank_account_id, memo, total_amount, created_by_name)
  values (p_deposit_date, p_bank_account_id, p_memo, v_total, p_created_by_name)
  returning id, deposit_number into v_deposit_id, v_number;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into deposit_lines (deposit_id, line_no, account_id, received_from, description, amount)
    values (
      v_deposit_id, v_line_no, (v_line->>'account_id')::uuid,
      v_line->>'received_from', v_line->>'description', (v_line->>'amount')::numeric
    );
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (p_deposit_date, coalesce(p_memo, 'Deposit ' || v_number), 'draft', 'make_deposit', v_deposit_id, p_created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 1, p_bank_account_id, v_total, 0, 'Deposit ' || v_number);

  v_line_no := 2;
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (
      v_entry_id, v_line_no, (v_line->>'account_id')::uuid, 0, (v_line->>'amount')::numeric,
      coalesce(v_line->>'description', 'Deposit ' || v_number)
    );
    v_line_no := v_line_no + 1;
  end loop;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update deposits set posted_entry_id = v_entry_id where id = v_deposit_id;

  return v_number;
end;
$$ language plpgsql security definer;

create or replace function void_deposit(p_deposit_id uuid)
returns void as $$
declare
  v_deposit deposits%rowtype;
  v_line    record;
  v_entry_id uuid;
  v_line_no int := 1;
begin
  select * into v_deposit from deposits where id = p_deposit_id;
  if not found then
    raise exception 'Deposit not found';
  end if;
  if v_deposit.status = 'void' then
    return;
  end if;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (current_date, 'Void deposit ' || v_deposit.deposit_number, 'draft', 'make_deposit', v_deposit.id, v_deposit.created_by_name)
  returning id into v_entry_id;

  for v_line in select * from deposit_lines where deposit_id = p_deposit_id order by line_no
  loop
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_line.account_id, v_line.amount, 0, 'Void deposit ' || v_deposit.deposit_number);
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_deposit.bank_account_id, 0, v_deposit.total_amount, 'Void deposit ' || v_deposit.deposit_number);

  update journal_entries set status = 'posted' where id = v_entry_id;
  update deposits set status = 'void' where id = p_deposit_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 3. PAY BILLS — settles open 'bill'-type expenses (015's flagged
-- gap). Dr Accounts Payable · Cr bank account. Mirrors
-- receive_payment()'s allocation pattern on the AP side.
-- ============================================================
alter table expenses add column if not exists amount_paid numeric(14,2) not null default 0;

create sequence bill_payment_number_seq start 1;

create or replace function next_bill_payment_number_preview()
returns text as $$
  select 'BPMT-' || lpad((last_value + case when is_called then 1 else 0 end)::text, 6, '0')
  from bill_payment_number_seq;
$$ language sql stable;

create table bill_payments (
  id              uuid primary key default gen_random_uuid(),
  payment_number  text not null unique,
  payment_date    date not null default current_date,
  vendor_id       uuid not null references vendors(id),
  amount          numeric(14,2) not null check (amount > 0),
  bank_account_id uuid not null references chart_of_accounts(id),
  reference       text,
  memo            text,
  status          text not null default 'posted' check (status in ('posted','void')),
  posted_entry_id uuid references journal_entries(id),
  created_by_name text,
  created_at      timestamptz not null default now()
);

create index idx_bill_payments_vendor on bill_payments (vendor_id);

create or replace function assign_bill_payment_number()
returns trigger as $$
begin
  if new.payment_number is null or new.payment_number = '' then
    new.payment_number := 'BPMT-' || lpad(nextval('bill_payment_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_bill_payment_number
  before insert on bill_payments
  for each row execute function assign_bill_payment_number();

create table bill_payment_allocations (
  id             uuid primary key default gen_random_uuid(),
  bill_payment_id uuid not null references bill_payments(id) on delete cascade,
  expense_id     uuid not null references expenses(id),
  amount_applied numeric(14,2) not null check (amount_applied > 0)
);

create index idx_bill_payment_allocations_payment on bill_payment_allocations (bill_payment_id);
create index idx_bill_payment_allocations_expense on bill_payment_allocations (expense_id);

create trigger trg_audit_bill_payments after insert or update or delete on bill_payments
  for each row execute function write_audit_log();

create or replace function pay_bills(
  p_vendor_id       uuid,
  p_payment_date    date,
  p_amount          numeric,
  p_bank_account_id uuid,
  p_reference       text,
  p_memo            text,
  p_created_by_name text,
  p_allocations     jsonb
) returns text as $$
declare
  v_payment_id     uuid;
  v_payment_number text;
  v_entry_id       uuid;
  v_ap_id          uuid;
  v_alloc          jsonb;
  v_alloc_sum      numeric := 0;
  v_expense        expenses%rowtype;
  v_remaining      numeric;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select id into v_ap_id from chart_of_accounts where system_role = 'accounts_payable';
  if v_ap_id is null then
    raise exception 'Accounts Payable system account not found';
  end if;

  select coalesce(sum((elem->>'amount')::numeric), 0) into v_alloc_sum
  from jsonb_array_elements(p_allocations) elem;

  if round(v_alloc_sum, 2) <> round(p_amount, 2) then
    raise exception 'Applied amount (%) must equal the amount paid (%)', v_alloc_sum, p_amount;
  end if;

  for v_alloc in select * from jsonb_array_elements(p_allocations)
  loop
    select * into v_expense from expenses where id = (v_alloc->>'expense_id')::uuid for update;
    if not found then
      raise exception 'Bill % not found', v_alloc->>'expense_id';
    end if;
    if v_expense.vendor_id <> p_vendor_id then
      raise exception 'Bill % does not belong to this vendor', v_expense.expense_number;
    end if;
    if v_expense.payment_type <> 'bill' then
      raise exception 'Expense % is not an open bill', v_expense.expense_number;
    end if;
    v_remaining := v_expense.total_amount - v_expense.amount_paid;
    if (v_alloc->>'amount')::numeric > v_remaining + 0.01 then
      raise exception 'Applied amount for bill % (%) exceeds its balance owed (%)',
        v_expense.expense_number, (v_alloc->>'amount')::numeric, v_remaining;
    end if;
  end loop;

  insert into bill_payments (payment_date, vendor_id, amount, bank_account_id, reference, memo, created_by_name)
  values (p_payment_date, p_vendor_id, p_amount, p_bank_account_id, p_reference, p_memo, p_created_by_name)
  returning id, payment_number into v_payment_id, v_payment_number;

  for v_alloc in select * from jsonb_array_elements(p_allocations)
  loop
    insert into bill_payment_allocations (bill_payment_id, expense_id, amount_applied)
    values (v_payment_id, (v_alloc->>'expense_id')::uuid, (v_alloc->>'amount')::numeric);

    update expenses
    set amount_paid = amount_paid + (v_alloc->>'amount')::numeric
    where id = (v_alloc->>'expense_id')::uuid;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (p_payment_date, 'Bill payment — ' || v_payment_number, p_reference, 'draft', 'pay_bills', v_payment_id, p_created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
  values (v_entry_id, 1, v_ap_id, p_vendor_id, p_amount, 0, 'Bill payment ' || v_payment_number);

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 2, p_bank_account_id, 0, p_amount, 'Bill payment ' || v_payment_number);

  update journal_entries set status = 'posted' where id = v_entry_id;
  update bill_payments set posted_entry_id = v_entry_id where id = v_payment_id;

  return v_payment_number;
end;
$$ language plpgsql security definer;

create or replace function void_bill_payment(p_bill_payment_id uuid)
returns void as $$
declare
  v_payment bill_payments%rowtype;
  v_alloc   record;
  v_ap_id   uuid;
  v_entry_id uuid;
begin
  select * into v_payment from bill_payments where id = p_bill_payment_id;
  if not found then
    raise exception 'Bill payment not found';
  end if;
  if v_payment.status = 'void' then
    return;
  end if;

  select id into v_ap_id from chart_of_accounts where system_role = 'accounts_payable';

  for v_alloc in select * from bill_payment_allocations where bill_payment_id = p_bill_payment_id
  loop
    update expenses set amount_paid = amount_paid - v_alloc.amount_applied where id = v_alloc.expense_id;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (current_date, 'Void bill payment ' || v_payment.payment_number, v_payment.reference, 'draft', 'pay_bills', v_payment.id, v_payment.created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
  values (v_entry_id, 1, v_ap_id, v_payment.vendor_id, 0, v_payment.amount, 'Void bill payment ' || v_payment.payment_number);

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 2, v_payment.bank_account_id, v_payment.amount, 0, 'Void bill payment ' || v_payment.payment_number);

  update journal_entries set status = 'posted' where id = v_entry_id;
  update bill_payments set status = 'void' where id = p_bill_payment_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 4. BANK RECONCILIATION — cleared flag lives directly on
-- journal_lines so every existing ledger view sees it for free.
-- ============================================================
alter table journal_lines add column if not exists cleared boolean not null default false;

create table bank_reconciliations (
  id                       uuid primary key default gen_random_uuid(),
  bank_account_id          uuid not null references chart_of_accounts(id),
  statement_date           date not null,
  beginning_balance        numeric(14,2) not null,
  statement_ending_balance numeric(14,2) not null,
  cleared_balance          numeric(14,2) not null,
  status                   text not null default 'completed' check (status in ('completed','reopened')),
  created_by_name          text,
  created_at               timestamptz not null default now()
);

create index idx_bank_reconciliations_account on bank_reconciliations (bank_account_id);

alter table journal_lines add column if not exists reconciliation_id uuid references bank_reconciliations(id);

create trigger trg_audit_bank_reconciliations after insert or update or delete on bank_reconciliations
  for each row execute function write_audit_log();

-- Uncleared lines for a bank account up to (and including) a cutoff date —
-- what the reconciliation screen lists for the user to tick off against
-- their statement.
create or replace function uncleared_bank_lines(p_bank_account_id uuid, p_as_of date)
returns table (
  line_id     uuid,
  entry_date  date,
  entry_number text,
  description text,
  debit       numeric,
  credit      numeric
) as $$
  select jl.id, je.entry_date, je.entry_number, jl.description, jl.debit, jl.credit
  from journal_lines jl
  join journal_entries je on je.id = jl.entry_id
  where jl.account_id = p_bank_account_id
    and jl.cleared = false
    and je.status = 'posted'
    and je.entry_date <= p_as_of
  order by je.entry_date, je.entry_number;
$$ language sql stable;

-- Finishes a reconciliation: marks the chosen lines cleared, and
-- refuses to complete unless beginning + cleared movement matches the
-- statement ending balance — same "must be zero to finish" rule QB
-- enforces.
create or replace function complete_reconciliation(
  p_bank_account_id  uuid,
  p_statement_date   date,
  p_beginning_balance numeric,
  p_ending_balance   numeric,
  p_cleared_line_ids uuid[],
  p_created_by_name  text
) returns uuid as $$
declare
  v_movement numeric := 0;
  v_recon_id uuid;
begin
  select coalesce(sum(debit - credit), 0) into v_movement
  from journal_lines
  where id = any(p_cleared_line_ids) and account_id = p_bank_account_id and cleared = false;

  if round(p_beginning_balance + v_movement, 2) <> round(p_ending_balance, 2) then
    raise exception 'Cleared balance (%) does not match the statement ending balance (%) — check the ticked items.',
      round(p_beginning_balance + v_movement, 2), round(p_ending_balance, 2);
  end if;

  insert into bank_reconciliations (
    bank_account_id, statement_date, beginning_balance, statement_ending_balance, cleared_balance, created_by_name
  ) values (
    p_bank_account_id, p_statement_date, p_beginning_balance, p_ending_balance, p_beginning_balance + v_movement, p_created_by_name
  ) returning id into v_recon_id;

  update journal_lines
  set cleared = true, reconciliation_id = v_recon_id
  where id = any(p_cleared_line_ids) and account_id = p_bank_account_id and cleared = false;

  return v_recon_id;
end;
$$ language plpgsql security definer;

-- Reopens a completed reconciliation: unclears its lines so they can
-- be re-ticked (e.g. the statement had an error).
create or replace function reopen_reconciliation(p_reconciliation_id uuid)
returns void as $$
begin
  update journal_lines set cleared = false, reconciliation_id = null where reconciliation_id = p_reconciliation_id;
  update bank_reconciliations set status = 'reopened' where id = p_reconciliation_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- GRANTS + RLS — same posture as 013/015 (anon full access until
-- real auth ships).
-- ============================================================
grant execute on function next_check_number_preview() to authenticated, anon;
grant execute on function write_check(date, uuid, text, text, uuid, uuid, text, text, boolean, text, jsonb) to authenticated, anon;
grant execute on function void_check(uuid) to authenticated, anon;
grant execute on function next_deposit_number_preview() to authenticated, anon;
grant execute on function make_deposit(date, uuid, text, text, jsonb) to authenticated, anon;
grant execute on function void_deposit(uuid) to authenticated, anon;
grant execute on function next_bill_payment_number_preview() to authenticated, anon;
grant execute on function pay_bills(uuid, date, numeric, uuid, text, text, text, jsonb) to authenticated, anon;
grant execute on function void_bill_payment(uuid) to authenticated, anon;
grant execute on function uncleared_bank_lines(uuid, date) to authenticated, anon;
grant execute on function complete_reconciliation(uuid, date, numeric, numeric, uuid[], text) to authenticated, anon;
grant execute on function reopen_reconciliation(uuid) to authenticated, anon;

alter table checks enable row level security;
alter table check_lines enable row level security;
alter table deposits enable row level security;
alter table deposit_lines enable row level security;
alter table bill_payments enable row level security;
alter table bill_payment_allocations enable row level security;
alter table bank_reconciliations enable row level security;

create policy "authenticated read/write" on checks for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on check_lines for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on deposits for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on deposit_lines for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on bill_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on bill_payment_allocations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on bank_reconciliations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "(temp, no-login) anon manages checks" on checks
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages check lines" on check_lines
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages deposits" on deposits
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages deposit lines" on deposit_lines
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages bill payments" on bill_payments
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages bill payment allocations" on bill_payment_allocations
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages bank reconciliations" on bank_reconciliations
  for all to anon using (true) with check (true);

grant select, insert, update, delete on checks, check_lines to authenticated, anon;
grant select, insert, update, delete on deposits, deposit_lines to authenticated, anon;
grant select, insert, update, delete on bill_payments, bill_payment_allocations to authenticated, anon;
grant select, insert, update, delete on bank_reconciliations to authenticated, anon;
grant usage, select on check_number_seq, deposit_number_seq, bill_payment_number_seq to authenticated, anon;
