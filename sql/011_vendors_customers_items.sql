-- ============================================================
-- VENDOR CENTER / CUSTOMER CENTER / ITEMS
-- Proper master data instead of free-text names typed on every
-- invoice/journal line. Invoices still snapshot the customer's
-- name/address/TIN at time of issue (so old invoices don't change
-- if a customer record is edited later) but now also carry a
-- customer_id link for reporting + the "Transactions" tab on the
-- Customer/Vendor Center.
-- ============================================================

create type party_terms as enum ('due_on_receipt','net_15','net_30','net_45','net_60','custom');

-- ---------- VENDORS ----------
create table vendors (
  id              uuid primary key default gen_random_uuid(),
  display_name    text not null,
  company_name    text,
  contact_person  text,
  email           text,
  phone           text,
  address         text,
  city            text,
  tin_vat         text,
  payment_terms   party_terms not null default 'net_30',
  opening_balance numeric(14,2) not null default 0,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_vendors_display_name on vendors (display_name);

-- ---------- CUSTOMERS ----------
create table customers (
  id              uuid primary key default gen_random_uuid(),
  display_name    text not null,
  company_name    text,
  contact_person  text,
  email           text,
  phone           text,
  address         text,
  city            text,
  tin_vat         text,
  payment_terms   party_terms not null default 'net_30',
  opening_balance numeric(14,2) not null default 0,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_customers_display_name on customers (display_name);

-- ---------- ITEMS (products/services for the invoice line dropdown) ----------
create type item_type as enum ('service','inventory','non_inventory');

create table items (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  description       text,
  item_type         item_type not null default 'service',
  unit_price        numeric(14,2) not null default 0,
  income_account_id uuid references chart_of_accounts(id),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index idx_items_code on items (code);

-- ---------- LINK INVOICES TO CUSTOMERS / LINES TO ITEMS ----------
alter table invoices add column customer_id uuid references customers(id) on delete set null;
alter table invoice_lines add column item_id uuid references items(id) on delete set null;
create index idx_invoices_customer on invoices (customer_id);

-- ---------- updated_at maintenance ----------
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vendors_touch before update on vendors
  for each row execute function touch_updated_at();
create trigger trg_customers_touch before update on customers
  for each row execute function touch_updated_at();

-- ---------- audit log (reuses existing write_audit_log()) ----------
create trigger trg_audit_vendors after insert or update or delete on vendors
  for each row execute function write_audit_log();
create trigger trg_audit_customers after insert or update or delete on customers
  for each row execute function write_audit_log();
create trigger trg_audit_items after insert or update or delete on items
  for each row execute function write_audit_log();

-- ============================================================
-- RLS — same posture as the rest of the app (003 + temp 006):
-- authenticated gets full access; anon gets full access too until
-- real login exists. Remove the anon policies once auth ships.
-- ============================================================
alter table vendors enable row level security;
alter table customers enable row level security;
alter table items enable row level security;

create policy "authenticated read/write" on vendors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on customers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "(temp, no-login) anon manages vendors" on vendors
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages customers" on customers
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages items" on items
  for all to anon using (true) with check (true);

grant select, insert, update, delete on vendors, customers, items to authenticated, anon;

-- A few starter items so the invoice line dropdown isn't empty on day one.
insert into items (code, name, description, item_type, unit_price) values
('SVC-001', 'Consulting Services', 'General consulting / advisory services', 'service', 0),
('GEN-001', 'General Item', 'Miscellaneous line item', 'non_inventory', 0);
