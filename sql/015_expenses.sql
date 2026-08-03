-- ============================================================
-- RECORD EXPENSES — the AP-side mirror of invoices/payments.
--
-- Two ways to record an expense (payment_type):
--   'paid_now' — Dr Expense category(ies) / Cr Cash·Bank, posted
--                immediately. vendor_id is tagged on EVERY line
--                (both the expense debit and the cash credit) so
--                it nets to zero on the vendor's balance (nothing
--                owed — it was paid on the spot) while still
--                showing up in their Vendor Center transaction
--                history, which is the whole point of "linking to
--                relevant parties".
--   'bill'     — Dr Expense category(ies) / Cr Accounts Payable,
--                posted immediately as a real payable. vendor_id
--                is tagged ONLY on the AP line — same precedent as
--                invoices tagging customer_id only on the AR line —
--                so it correctly adds to the "amount owed" balance.
--
-- Known gap, flagged rather than half-built: there's no "Pay Bills"
-- screen yet to settle a 'bill' expense later (the AR side has this
-- via Receive Payment; the AP side doesn't yet). A bill posts and
-- sits as owed indefinitely until that's built. Also no input-VAT
-- tracking on purchases — line amounts are treated as the full cost.
-- ============================================================

update chart_of_accounts set system_role = 'accounts_payable' where name = 'Accounts Payable' and system_role is null;

create sequence expense_number_seq start 1;

create or replace function next_expense_number_preview()
returns text as $$
  select 'EXP-' || lpad((last_value + case when is_called then 1 else 0 end)::text, 6, '0')
  from expense_number_seq;
$$ language sql stable;

create table expenses (
  id                    uuid primary key default gen_random_uuid(),
  expense_number        text not null unique,
  expense_date          date not null default current_date,
  vendor_id             uuid not null references vendors(id),
  payment_type          text not null check (payment_type in ('paid_now','bill')),
  payment_method        text check (payment_method in ('cash','bank_transfer','cheque','card','other')),
  paid_from_account_id  uuid references chart_of_accounts(id),
  reference             text,
  memo                  text,
  total_amount          numeric(14,2) not null default 0,
  status                text not null default 'posted' check (status in ('posted','void')),
  posted_entry_id       uuid references journal_entries(id),
  created_by_name       text,
  created_at            timestamptz not null default now(),
  constraint paid_now_needs_account check (payment_type <> 'paid_now' or paid_from_account_id is not null)
);

create index idx_expenses_vendor on expenses (vendor_id);

create or replace function assign_expense_number()
returns trigger as $$
begin
  if new.expense_number is null or new.expense_number = '' then
    new.expense_number := 'EXP-' || lpad(nextval('expense_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_expense_number
  before insert on expenses
  for each row execute function assign_expense_number();

create table expense_lines (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null references expenses(id) on delete cascade,
  line_no      int not null,
  account_id   uuid not null references chart_of_accounts(id),
  description  text,
  amount       numeric(14,2) not null check (amount > 0)
);

create index idx_expense_lines_expense on expense_lines (expense_id);

create trigger trg_audit_expenses after insert or update or delete on expenses
  for each row execute function write_audit_log();

-- ============================================================
-- record_expense — atomic: create the expense, its lines, and the
-- matching GL entry (Dr expense categories / Cr cash-or-AP).
-- p_lines shape: '[{"account_id":"...","description":"...","amount":123.45}, ...]'
-- ============================================================
create or replace function record_expense(
  p_vendor_id            uuid,
  p_expense_date         date,
  p_payment_type         text,
  p_payment_method       text,
  p_paid_from_account_id uuid,
  p_reference            text,
  p_memo                 text,
  p_created_by_name      text,
  p_lines                jsonb
) returns text as $$
declare
  v_expense_id     uuid;
  v_expense_number text;
  v_entry_id       uuid;
  v_ap_id          uuid;
  v_credit_account uuid;
  v_total          numeric := 0;
  v_line           jsonb;
  v_line_no        int := 1;
begin
  if p_payment_type not in ('paid_now', 'bill') then
    raise exception 'payment_type must be paid_now or bill';
  end if;

  select coalesce(sum((elem->>'amount')::numeric), 0) into v_total
  from jsonb_array_elements(p_lines) elem;

  if v_total <= 0 then
    raise exception 'Add at least one expense line with an amount greater than zero';
  end if;

  if p_payment_type = 'paid_now' then
    v_credit_account := p_paid_from_account_id;
    if v_credit_account is null then
      raise exception 'Select a Paid From account for a paid-now expense';
    end if;
  else
    select id into v_ap_id from chart_of_accounts where system_role = 'accounts_payable';
    if v_ap_id is null then
      raise exception 'Accounts Payable system account not found';
    end if;
    v_credit_account := v_ap_id;
  end if;

  insert into expenses (expense_date, vendor_id, payment_type, payment_method, paid_from_account_id,
                         reference, memo, total_amount, created_by_name)
  values (p_expense_date, p_vendor_id, p_payment_type,
          case when p_payment_type = 'paid_now' then p_payment_method else null end,
          case when p_payment_type = 'paid_now' then p_paid_from_account_id else null end,
          p_reference, p_memo, v_total, p_created_by_name)
  returning id, expense_number into v_expense_id, v_expense_number;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into expense_lines (expense_id, line_no, account_id, description, amount)
    values (v_expense_id, v_line_no, (v_line->>'account_id')::uuid, v_line->>'description', (v_line->>'amount')::numeric);
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (
    p_expense_date,
    coalesce(p_memo, (case when p_payment_type = 'bill' then 'Bill ' else 'Expense ' end) || v_expense_number),
    p_reference,
    'draft',
    'expense',
    v_expense_id,
    p_created_by_name
  )
  returning id into v_entry_id;

  v_line_no := 1;
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
    values (
      v_entry_id,
      v_line_no,
      (v_line->>'account_id')::uuid,
      case when p_payment_type = 'paid_now' then p_vendor_id else null end,
      (v_line->>'amount')::numeric,
      0,
      coalesce(v_line->>'description', v_expense_number)
    );
    v_line_no := v_line_no + 1;
  end loop;

  insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_credit_account, p_vendor_id, 0, v_total,
          (case when p_payment_type = 'bill' then 'Bill ' else 'Expense ' end) || v_expense_number);

  update journal_entries set status = 'posted' where id = v_entry_id;
  update expenses set posted_entry_id = v_entry_id where id = v_expense_id;

  return v_expense_number;
end;
$$ language plpgsql security definer;

-- ============================================================
-- void_expense — reverses the GL entry and marks the expense void.
-- Idempotent.
-- ============================================================
create or replace function void_expense(p_expense_id uuid)
returns void as $$
declare
  v_expense expenses%rowtype;
  v_orig    record;
  v_entry_id uuid;
  v_line_no  int := 1;
begin
  select * into v_expense from expenses where id = p_expense_id;
  if not found then
    raise exception 'Expense not found';
  end if;
  if v_expense.status = 'void' then
    return;
  end if;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (current_date, 'Void ' || v_expense.expense_number, v_expense.reference, 'draft', 'expense', v_expense.id, v_expense.created_by_name)
  returning id into v_entry_id;

  for v_orig in
    select jl.account_id, jl.vendor_id, jl.debit, jl.credit
    from journal_lines jl
    where jl.entry_id = v_expense.posted_entry_id
    order by jl.line_no
  loop
    -- swap debit/credit to reverse each original line exactly
    insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_orig.account_id, v_orig.vendor_id, v_orig.credit, v_orig.debit,
            'Void ' || v_expense.expense_number);
    v_line_no := v_line_no + 1;
  end loop;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update expenses set status = 'void' where id = p_expense_id;
end;
$$ language plpgsql security definer;

grant execute on function next_expense_number_preview() to authenticated, anon;
grant execute on function record_expense(uuid, date, text, text, uuid, text, text, text, jsonb) to authenticated, anon;
grant execute on function void_expense(uuid) to authenticated, anon;

alter table expenses enable row level security;
alter table expense_lines enable row level security;

create policy "authenticated read/write" on expenses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on expense_lines for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "(temp, no-login) anon manages expenses" on expenses
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages expense lines" on expense_lines
  for all to anon using (true) with check (true);

grant select, insert, update, delete on expenses, expense_lines to authenticated, anon;
grant usage, select on expense_number_seq to authenticated, anon;

-- ============================================================
-- Expenses now exist, so fold them into the Admin reset (014).
-- create or replace is safe here even though 014 already ran —
-- this just updates that function's body.
-- ============================================================
create or replace function reset_all_transactions()
returns void as $$
begin
  truncate table journal_lines, journal_entries, invoice_lines, invoices,
                 payment_allocations, payments, expense_lines, expenses, audit_log;

  alter sequence je_number_seq restart with 1;
  alter sequence invoice_number_seq restart with 1;
  alter sequence payment_number_seq restart with 1;
  alter sequence expense_number_seq restart with 1;
end;
$$ language plpgsql security definer;
