-- ============================================================
-- STOCK MODULE — perpetual inventory, done the CA-correct way
--
-- Buying raw material is NOT an expense at time of purchase — it's
-- an ASSET (Inventory) until consumed. This was missing entirely:
-- Record Expense posts straight to an expense account, which is
-- correct for services/subcontracting but wrong for materials you
-- hold in stock.
--
-- receive_stock()  Dr Inventory / Cr Cash-Bank-or-AP
--                   (mirrors record_expense's paid_now/bill choice)
--                   Weighted-average cost: blends the new receipt's
--                   cost into the item's running unit_cost.
-- issue_stock()     Dr Direct Materials / Direct Expenses /
--                   Manufacturing Overhead (per the item's
--                   material_classification) — Cr Inventory
--                   THIS is where cost actually hits P&L.
--
-- material_classification is the "mark this as Direct / Direct
-- Other / Indirect" tagging: it decides which expense account an
-- item posts to when issued, matching the manufacturing cost
-- structure built in 016 exactly. Only meaningful for raw materials
-- (style_id is null) — finished goods published from a style don't
-- need it, they're sold, not consumed as a cost input.
-- ============================================================

alter table items add column if not exists quantity_on_hand numeric(14,3) not null default 0;
alter table items add column if not exists reorder_level numeric(14,3);
alter table items add column if not exists material_classification text
  check (material_classification in ('direct_material', 'direct_expense', 'indirect_material'));
alter table items add column if not exists expense_account_id uuid references chart_of_accounts(id);

update chart_of_accounts set system_role = 'inventory' where code = '1003';

create table stock_movements (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references items(id),
  movement_type    text not null check (movement_type in ('receipt', 'issue', 'adjustment')),
  qty_change       numeric(14,3) not null, -- positive = stock in, negative = stock out
  unit_cost        numeric(14,2) not null default 0,
  vendor_id        uuid references vendors(id),
  style_id         uuid references styles(id),
  reference        text,
  memo             text,
  posted_entry_id  uuid references journal_entries(id),
  created_by_name  text,
  movement_date    date not null default current_date,
  created_at       timestamptz not null default now()
);

create index idx_stock_movements_item on stock_movements (item_id);

create trigger trg_audit_stock_movements after insert or update or delete on stock_movements
for each row execute function write_audit_log();

alter table stock_movements enable row level security;
create policy "authenticated read/write" on stock_movements for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "(temp, no-login) anon manages stock movements" on stock_movements
  for all to anon using (true) with check (true);
grant select, insert, update, delete on stock_movements to authenticated, anon;

-- ============================================================
-- receive_stock — Goods Received Note. Posts Dr Inventory / Cr
-- Cash-Bank-or-AP, blends cost via weighted average.
-- ============================================================
create or replace function receive_stock(
  p_item_id              uuid,
  p_qty                  numeric,
  p_unit_cost            numeric,
  p_vendor_id            uuid,
  p_payment_type         text, -- 'paid_now' | 'bill'
  p_payment_method       text,
  p_paid_from_account_id uuid,
  p_reference            text,
  p_memo                 text,
  p_created_by_name      text
) returns text as $$
declare
  v_item           items%rowtype;
  v_inventory_id   uuid;
  v_ap_id          uuid;
  v_credit_account uuid;
  v_amount         numeric;
  v_new_qty        numeric;
  v_new_cost       numeric;
  v_entry_id       uuid;
  v_entry_number   text;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;
  if p_payment_type not in ('paid_now', 'bill') then
    raise exception 'payment_type must be paid_now or bill';
  end if;

  select * into v_item from items where id = p_item_id for update;
  if not found then
    raise exception 'Item not found';
  end if;

  select id into v_inventory_id from chart_of_accounts where system_role = 'inventory';
  if v_inventory_id is null then
    raise exception 'Inventory system account not found';
  end if;

  if p_payment_type = 'paid_now' then
    v_credit_account := p_paid_from_account_id;
    if v_credit_account is null then
      raise exception 'Select a Paid From account';
    end if;
  else
    select id into v_ap_id from chart_of_accounts where system_role = 'accounts_payable';
    if v_ap_id is null then
      raise exception 'Accounts Payable system account not found';
    end if;
    v_credit_account := v_ap_id;
  end if;

  v_amount := p_qty * p_unit_cost;
  v_new_qty := v_item.quantity_on_hand + p_qty;
  v_new_cost := case when v_new_qty > 0
    then ((v_item.quantity_on_hand * v_item.unit_cost) + v_amount) / v_new_qty
    else p_unit_cost
  end;

  update items set quantity_on_hand = v_new_qty, unit_cost = round(v_new_cost, 4) where id = p_item_id;

  insert into journal_entries (entry_date, memo, reference, status, source_type, created_by_name)
  values (current_date, coalesce(p_memo, 'Stock receipt — ' || v_item.name), p_reference, 'draft', 'inventory_adjustment', p_created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 1, v_inventory_id, v_amount, 0, 'Stock receipt — ' || v_item.name || ' (' || p_qty || ' units)');

  insert into journal_lines (entry_id, line_no, account_id, vendor_id, debit, credit, description)
  values (v_entry_id, 2, v_credit_account, p_vendor_id, 0, v_amount, 'Stock receipt — ' || v_item.name);

  update journal_entries set status = 'posted' where id = v_entry_id;
  select entry_number into v_entry_number from journal_entries where id = v_entry_id;

  insert into stock_movements (item_id, movement_type, qty_change, unit_cost, vendor_id, reference, memo, posted_entry_id, created_by_name)
  values (p_item_id, 'receipt', p_qty, p_unit_cost, p_vendor_id, p_reference, p_memo, v_entry_id, p_created_by_name);

  return v_entry_number;
end;
$$ language plpgsql security definer;

-- ============================================================
-- issue_stock — materials consumed (production, samples, write-off).
-- Posts Dr [item's classified expense account] / Cr Inventory.
-- This is where material cost finally becomes a P&L expense.
-- ============================================================
create or replace function issue_stock(
  p_item_id         uuid,
  p_qty             numeric,
  p_style_id        uuid,
  p_memo            text,
  p_created_by_name text
) returns text as $$
declare
  v_item         items%rowtype;
  v_inventory_id uuid;
  v_amount       numeric;
  v_entry_id     uuid;
  v_entry_number text;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_item from items where id = p_item_id for update;
  if not found then
    raise exception 'Item not found';
  end if;
  if p_qty > v_item.quantity_on_hand then
    raise exception 'Only % in stock — cannot issue %', v_item.quantity_on_hand, p_qty;
  end if;
  if v_item.expense_account_id is null then
    raise exception 'This item has no expense account assigned — edit the item and set one first';
  end if;

  select id into v_inventory_id from chart_of_accounts where system_role = 'inventory';
  v_amount := p_qty * v_item.unit_cost;

  update items set quantity_on_hand = quantity_on_hand - p_qty where id = p_item_id;

  insert into journal_entries (entry_date, memo, status, source_type, created_by_name)
  values (current_date, coalesce(p_memo, 'Stock issue — ' || v_item.name), 'draft', 'inventory_adjustment', p_created_by_name)
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 1, v_item.expense_account_id, v_amount, 0, 'Stock issue — ' || v_item.name || ' (' || p_qty || ' units)');

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, 2, v_inventory_id, 0, v_amount, 'Stock issue — ' || v_item.name);

  update journal_entries set status = 'posted' where id = v_entry_id;
  select entry_number into v_entry_number from journal_entries where id = v_entry_id;

  insert into stock_movements (item_id, movement_type, qty_change, unit_cost, style_id, memo, posted_entry_id, created_by_name)
  values (p_item_id, 'issue', -p_qty, v_item.unit_cost, p_style_id, p_memo, v_entry_id, p_created_by_name);

  return v_entry_number;
end;
$$ language plpgsql security definer;

grant execute on function receive_stock(uuid, numeric, numeric, uuid, text, text, uuid, text, text, text) to authenticated, anon;
grant execute on function issue_stock(uuid, numeric, uuid, text, text) to authenticated, anon;
