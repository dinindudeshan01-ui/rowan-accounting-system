-- ============================================================
-- INVOICES
-- Sales/tax invoices issued to customers. Separate from journal_entries -
-- posting an invoice to the ledger (Accounts Receivable / Sales Revenue /
-- VAT / SSCL) is a follow-up feature; for now this just stores and prints
-- the invoice itself, matching the approved Tax Invoice template.
-- ============================================================

create type invoice_status as enum ('draft', 'issued', 'paid', 'void');

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  invoice_number  text not null unique,
  invoice_date    date not null default current_date,
  due_date        date,
  currency        text not null default 'LKR',
  status          invoice_status not null default 'draft',

  supplier_name    text not null default 'Rowan Casual Wear Pvt Ltd',
  supplier_address text,
  supplier_phone   text,
  supplier_email   text,
  supplier_website text,
  supplier_tin     text,

  purchaser_name    text not null,
  purchaser_address text,
  purchaser_tin     text,

  bank_name    text,
  bank_branch  text,
  bank_acc_name text,
  bank_acc_no  text,
  payment_terms text,

  vat_rate   numeric not null default 18,
  sscl_rate  numeric not null default 2.5,
  sscl_base_pct numeric not null default 85, -- SSCL charged on 85% of turnover, per statutory note on the template

  memo        text,
  created_by_name text,
  created_at  timestamptz not null default now()
);

create table invoice_lines (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  line_no      int not null,
  code         text,
  description  text not null,
  qty          numeric not null default 1,
  unit_price   numeric not null default 0
);

create index on invoice_lines (invoice_id);

-- Sequential invoice numbers: INV-000001, INV-000002, ...
create sequence invoice_number_seq start 1;

create or replace function next_invoice_number_preview()
returns text as $$
  select 'INV-' || lpad((last_value + case when is_called then 1 else 0 end)::text, 6, '0')
  from invoice_number_seq;
$$ language sql stable;

create or replace function assign_invoice_number()
returns trigger as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'INV-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_assign_invoice_number
  before insert on invoices
  for each row execute function assign_invoice_number();

alter table invoices enable row level security;
alter table invoice_lines enable row level security;

create policy "everyone reads invoices" on invoices for select using (auth.role() = 'authenticated');
create policy "everyone manages invoices" on invoices for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "everyone reads invoice lines" on invoice_lines for select using (auth.role() = 'authenticated');
create policy "everyone manages invoice lines" on invoice_lines for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on invoices, invoice_lines to authenticated;
grant usage, select on invoice_number_seq to authenticated;
grant execute on function next_invoice_number_preview() to authenticated;

-- Match sql/006_temp_anon_access.sql: no login yet, so also open this up to anon.
-- ⚠️ Remove alongside the rest of 006 once real auth/login exists.
create policy "(temp, no-login) anon manages invoices" on invoices
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages invoice lines" on invoice_lines
  for all to anon using (true) with check (true);
grant select, insert, update, delete on invoices, invoice_lines to anon;
grant usage, select on invoice_number_seq to anon;
grant execute on function next_invoice_number_preview() to anon;
