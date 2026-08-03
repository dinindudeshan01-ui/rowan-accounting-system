-- ============================================================
-- RECEIVE PAYMENTS
-- Closes the other half of the AR loop: 012 posted invoices to the
-- ledger (Dr AR / Cr Revenue+Tax) when issued. This migration adds
-- the customer-payment side (Dr Cash/Bank / Cr AR) and the invoice
-- ⇄ payment matching (payment_allocations) that drives balance_due
-- and status. Once this runs, the Customer Center balance and P&L
-- both stay correct end-to-end: issue → post → receive → settle.
--
-- Design notes:
--   - One payment can be split across several open invoices
--     (payment_allocations), like QuickBooks' Receive Payments screen.
--   - For now, applied amount must exactly equal amount received —
--     no "unapplied credit on account" concept yet. That's a
--     reasonable v2 (would need a customer-credit/advance liability
--     account); flagging rather than half-building it.
--   - receive_payment() is one atomic function (not several client
--     round-trips) so a partial failure can't leave an invoice
--     half-updated with no matching GL entry.
-- ============================================================

create sequence payment_number_seq start 1;

create or replace function next_payment_number_preview()
returns text as $$
  select 'PMT-' || lpad((last_value + case when is_called then 1 else 0 end)::text, 6, '0')
  from payment_number_seq;
$$ language sql stable;

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  payment_number      text not null unique,
  payment_date        date not null default current_date,
  customer_id         uuid not null references customers(id),
  amount              numeric(14,2) not null check (amount > 0),
  payment_method      text not null default 'bank_transfer'
                        check (payment_method in ('cash','bank_transfer','cheque','card','other')),
  deposit_account_id  uuid not null references chart_of_accounts(id),
  reference           text,
  memo                text,
  status              text not null default 'posted' check (status in ('posted','void')),
  posted_entry_id     uuid references journal_entries(id),
  created_by_name     text,
  created_at          timestamptz not null default now()
);

create index idx_payments_customer on payments (customer_id);

create or replace function assign_payment_number()
returns trigger as $$
begin
  if new.payment_number is null or new.payment_number = '' then
    new.payment_number := 'PMT-' || lpad(nextval('payment_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_payment_number
  before insert on payments
  for each row execute function assign_payment_number();

create table payment_allocations (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid not null references payments(id) on delete cascade,
  invoice_id     uuid not null references invoices(id),
  amount_applied numeric(14,2) not null check (amount_applied > 0)
);

create index idx_payment_allocations_payment on payment_allocations (payment_id);
create index idx_payment_allocations_invoice on payment_allocations (invoice_id);

alter table invoices add column if not exists amount_paid numeric(14,2) not null default 0;

create trigger trg_audit_payments after insert or update or delete on payments
  for each row execute function write_audit_log();

-- ============================================================
-- receive_payment — atomic: create the payment, apply it across the
-- chosen invoices, and post the Dr Cash/Bank · Cr AR entry.
-- p_allocations shape: '[{"invoice_id":"...","amount":123.45}, ...]'
-- ============================================================
create or replace function receive_payment(
  p_customer_id        uuid,
  p_payment_date       date,
  p_amount             numeric,
  p_payment_method     text,
  p_deposit_account_id uuid,
  p_reference          text,
  p_memo               text,
  p_created_by_name    text,
  p_allocations        jsonb
) returns text as $$
declare
  v_payment_id     uuid;
  v_payment_number text;
  v_entry_id       uuid;
  v_ar_id          uuid;
  v_alloc          jsonb;
  v_alloc_sum      numeric := 0;
  v_invoice        invoices%rowtype;
  v_remaining      numeric;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select id into v_ar_id from chart_of_accounts where system_role = 'accounts_receivable';
  if v_ar_id is null then
    raise exception 'Accounts Receivable system account not found';
  end if;

  select coalesce(sum((elem->>'amount')::numeric), 0) into v_alloc_sum
  from jsonb_array_elements(p_allocations) elem;

  if round(v_alloc_sum, 2) <> round(p_amount, 2) then
    raise exception 'Applied amount (%) must equal the amount received (%)', v_alloc_sum, p_amount;
  end if;

  -- Validate + lock each target invoice before touching anything.
  for v_alloc in select * from jsonb_array_elements(p_allocations)
  loop
    select * into v_invoice from invoices where id = (v_alloc->>'invoice_id')::uuid for update;
    if not found then
      raise exception 'Invoice % not found', v_alloc->>'invoice_id';
    end if;
    if v_invoice.customer_id <> p_customer_id then
      raise exception 'Invoice % does not belong to this customer', v_invoice.invoice_number;
    end if;
    v_remaining := v_invoice.total_amount - v_invoice.amount_paid;
    if (v_alloc->>'amount')::numeric > v_remaining + 0.01 then
      raise exception 'Applied amount for invoice % (%) exceeds its balance due (%)',
        v_invoice.invoice_number, (v_alloc->>'amount')::numeric, v_remaining;
    end if;
  end loop;

  insert into payments (payment_date, customer_id, amount, payment_method, deposit_account_id, reference, memo, created_by_name)
  values (p_payment_date, p_customer_id, p_amount, p_payment_method, p_deposit_account_id, p_reference, p_memo, p_created_by_name)
  returning id, payment_number into v_payment_id, v_payment_number;

  for v_alloc in select * from jsonb_array_elements(p_allocations)
  loop
    insert into payment_allocations (payment_id, invoice_id, amount_applied)
    values (v_payment_id, (v_alloc->>'invoice_id')::uuid, (v_alloc->>'amount')::numeric);

    update invoices
    set amount_paid = amount_paid + (v_alloc->>'amount')::numeric,
        status = case
          when amount_paid + (v_alloc->>'amount')::numeric >= total_amount - 0.01 then 'paid'
          else status
        end
    where id = (v_alloc->>'invoice_id')::uuid;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (
    p_payment_date,
    'Payment received — ' || v_payment_number,
    p_reference,
    'draft',
    'manual',
    v_payment_id,
    p_created_by_name
  )
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 1, p_deposit_account_id, p_amount, 0, 'Payment ' || v_payment_number || ' received');

  insert into journal_lines (entry_id, line_no, account_id, customer_id, debit, credit, description)
  values (v_entry_id, 2, v_ar_id, p_customer_id, 0, p_amount, 'Payment ' || v_payment_number || ' applied');

  update journal_entries set status = 'posted' where id = v_entry_id;
  update payments set posted_entry_id = v_entry_id where id = v_payment_id;

  return v_payment_number;
end;
$$ language plpgsql security definer;

-- ============================================================
-- void_payment — undoes a payment: reopens the invoice(s) it was
-- applied to and posts a reversing entry. Idempotent.
-- ============================================================
create or replace function void_payment(p_payment_id uuid)
returns void as $$
declare
  v_payment  payments%rowtype;
  v_alloc    record;
  v_ar_id    uuid;
  v_entry_id uuid;
begin
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    raise exception 'Payment not found';
  end if;
  if v_payment.status = 'void' then
    return;
  end if;

  select id into v_ar_id from chart_of_accounts where system_role = 'accounts_receivable';

  for v_alloc in select * from payment_allocations where payment_id = p_payment_id
  loop
    update invoices
    set amount_paid = amount_paid - v_alloc.amount_applied,
        status = case when status = 'paid' then 'issued' else status end
    where id = v_alloc.invoice_id;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (
    current_date,
    'Void payment ' || v_payment.payment_number,
    v_payment.reference,
    'draft',
    'manual',
    v_payment.id,
    v_payment.created_by_name
  )
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, customer_id, debit, credit, description)
  values (v_entry_id, 1, v_ar_id, v_payment.customer_id, v_payment.amount, 0, 'Void payment ' || v_payment.payment_number);

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 2, v_payment.deposit_account_id, 0, v_payment.amount, 'Void payment ' || v_payment.payment_number);

  update journal_entries set status = 'posted' where id = v_entry_id;
  update payments set status = 'void' where id = p_payment_id;
end;
$$ language plpgsql security definer;

grant execute on function next_payment_number_preview() to authenticated, anon;
grant execute on function receive_payment(uuid, date, numeric, text, uuid, text, text, text, jsonb) to authenticated, anon;
grant execute on function void_payment(uuid) to authenticated, anon;

-- ============================================================
-- RLS — same posture as the rest of the app (003 + temp 006):
-- authenticated gets full access; anon gets full access too until
-- real login exists. Remove the anon policies once auth ships.
-- ============================================================
alter table payments enable row level security;
alter table payment_allocations enable row level security;

create policy "authenticated read/write" on payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on payment_allocations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "(temp, no-login) anon manages payments" on payments
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages payment allocations" on payment_allocations
  for all to anon using (true) with check (true);

grant select, insert, update, delete on payments, payment_allocations to authenticated, anon;
grant usage, select on payment_number_seq to authenticated, anon;
