-- ============================================================
-- FULL ABSORPTION COSTING — Finished Goods capitalized, real COGS
--
-- This replaces the earlier simplification (materials expensed
-- directly on production) with proper standard costing:
--
--   PRODUCE:  Dr Finished Goods Inventory (material + labor + OH)
--             Cr Raw Material Inventory     (material, actual cost)
--             Cr Direct Labor Applied       (standard labor absorbed)
--             Cr Manufacturing Overhead Applied (standard OH absorbed)
--
--   SELL:     Dr Cost of Goods Sold
--             Cr Finished Goods Inventory   (at weighted-avg cost)
--
-- "Applied" accounts are CONTRA expense accounts (credit balance).
-- Pay actual wages via Record Expense → Dr Direct Labor Wages / Cr
-- Cash — that's a real Direct Labor subtype expense. Because
-- Direct Labor Applied shares that same subtype, get_pl()'s existing
-- subtype grouping nets them automatically: Actual − Applied = the
-- period's labor variance. Same mechanic for Manufacturing Overhead.
-- No new reporting logic needed for variance — it falls out of the
-- subtype math that's already there.
--
-- Deliberate simplification, stated plainly: no separate WIP
-- account. Materials/labor/overhead capitalize straight into
-- Finished Goods at the moment of production. For a garment
-- factory where a batch typically completes within the costing
-- period, WIP is usually immaterial — a defensible simplification,
-- not an oversight. Full WIP tracking (partially-complete batches
-- carrying a balance across period-end) would be the next step up
-- if that ever becomes material.
--
-- COGS is now what actually drives Gross Profit on the Trading
-- Account — replacing the old proxy (which used total production
-- cost for the period as a stand-in for cost of what was SOLD).
-- That proxy silently overstated COGS whenever production > sales
-- in a period. Real COGS only recognizes cost when a sale happens.
-- ============================================================

alter table chart_of_accounts add column if not exists is_contra boolean not null default false;

insert into chart_of_accounts (code, name, type, subtype, system_role) values
  ('1006', 'Finished Goods Inventory', 'asset', 'Inventory', 'finished_goods_inventory')
on conflict (code) do nothing;

insert into chart_of_accounts (code, name, type, subtype, system_role, is_contra) values
  ('5210', 'Direct Labor Applied', 'expense', 'Direct Labor', 'direct_labor_applied', true),
  ('5410', 'Manufacturing Overhead Applied', 'expense', 'Manufacturing Overhead', 'overhead_applied', true)
on conflict (code) do nothing;

insert into chart_of_accounts (code, name, type, subtype, system_role) values
  ('5001', 'Cost of Goods Sold', 'expense', 'Cost of Goods Sold', 'cost_of_goods_sold')
on conflict (code) do update set system_role = 'cost_of_goods_sold', subtype = 'Cost of Goods Sold', is_active = true;
-- Reuses code 5001 (the old catch-all "Cost of Goods Sold" account that 016
-- deactivated) rather than leaving it dormant — same name, now the real thing.

create table production_runs (
  id               uuid primary key default gen_random_uuid(),
  style_id         uuid not null references styles(id),
  item_id          uuid not null references items(id),
  qty              numeric(14,3) not null,
  material_cost    numeric(14,2) not null,
  labor_cost       numeric(14,2) not null,
  overhead_cost    numeric(14,2) not null,
  total_cost       numeric(14,2) not null,
  unit_cost        numeric(14,4) not null,
  posted_entry_id  uuid references journal_entries(id),
  memo             text,
  created_by_name  text,
  run_date         date not null default current_date,
  created_at       timestamptz not null default now()
);

create index idx_production_runs_style on production_runs (style_id);
create index idx_production_runs_date on production_runs (run_date);

create trigger trg_audit_production_runs after insert or update or delete on production_runs
for each row execute function write_audit_log();

alter table production_runs enable row level security;
create policy "authenticated read/write" on production_runs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "(temp, no-login) anon manages production runs" on production_runs
  for all to anon using (true) with check (true);
grant select, insert, update, delete on production_runs to authenticated, anon;

-- ============================================================
-- produce_style (v2) — capitalizes into Finished Goods instead of
-- expensing materials directly. Same validation guarantees as v1:
-- fully checked before anything is touched, all-or-nothing.
-- ============================================================
create or replace function produce_style(
  p_style_id        uuid,
  p_qty             numeric,
  p_memo            text,
  p_created_by_name text
) returns text as $$
declare
  v_style           styles%rowtype;
  v_fg_item         items%rowtype;
  v_raw_inv_id      uuid;
  v_fg_inv_id       uuid;
  v_labor_applied_id uuid;
  v_oh_applied_id   uuid;
  v_bom_count       int;
  v_bom             record;
  v_issue_qty       numeric;
  v_line_amount     numeric;
  v_total_material  numeric := 0;
  v_labor_cost      numeric;
  v_overhead_cost   numeric;
  v_total_cost      numeric;
  v_new_fg_qty      numeric;
  v_new_fg_cost     numeric;
  v_entry_id        uuid;
  v_entry_number    text;
  v_line_no         int := 1;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_style from styles where id = p_style_id;
  if not found then
    raise exception 'Style not found';
  end if;

  select * into v_fg_item from items where style_id = p_style_id for update;
  if not found then
    raise exception 'Publish this style to the sales catalog first (Costing tab) before producing it';
  end if;

  select count(*) into v_bom_count from style_bom_lines where style_id = p_style_id;
  if v_bom_count = 0 then
    raise exception 'This style has no Bill of Materials — add one before producing';
  end if;

  select id into v_raw_inv_id from chart_of_accounts where system_role = 'inventory';
  select id into v_fg_inv_id from chart_of_accounts where system_role = 'finished_goods_inventory';
  select id into v_labor_applied_id from chart_of_accounts where system_role = 'direct_labor_applied';
  select id into v_oh_applied_id from chart_of_accounts where system_role = 'overhead_applied';
  if v_raw_inv_id is null or v_fg_inv_id is null or v_labor_applied_id is null or v_oh_applied_id is null then
    raise exception 'Chart of accounts is missing a required system account for production costing';
  end if;

  -- Validate EVERY BOM line before touching anything.
  for v_bom in
    select bl.material_name, bl.consumption_qty, bl.wastage_pct, bl.item_id as material_item_id,
           it.name as item_name, it.quantity_on_hand, it.expense_account_id
    from style_bom_lines bl
    left join items it on it.id = bl.item_id
    where bl.style_id = p_style_id
  loop
    if v_bom.material_item_id is null then
      raise exception 'BOM line "%" has no linked stock item — link it to an item first', v_bom.material_name;
    end if;
    v_issue_qty := v_bom.consumption_qty * (1 + v_bom.wastage_pct / 100.0) * p_qty;
    if v_issue_qty > v_bom.quantity_on_hand then
      raise exception 'Not enough % in stock: need %, have %', v_bom.item_name, round(v_issue_qty, 3), v_bom.quantity_on_hand;
    end if;
  end loop;

  v_labor_cost := v_style.labor_cost_per_unit * p_qty;
  v_overhead_cost := v_style.overhead_cost_per_unit * p_qty;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (
    current_date,
    coalesce(p_memo, 'Production run — ' || v_style.style_no || ' × ' || p_qty),
    'draft', 'inventory_adjustment', p_style_id, p_created_by_name
  )
  returning id into v_entry_id;

  -- Materials: issue from Raw Material Inventory (credit), tally material cost.
  for v_bom in
    select bl.material_name, bl.consumption_qty, bl.wastage_pct, bl.item_id as material_item_id, it.unit_cost
    from style_bom_lines bl
    join items it on it.id = bl.item_id
    where bl.style_id = p_style_id
  loop
    v_issue_qty := v_bom.consumption_qty * (1 + v_bom.wastage_pct / 100.0) * p_qty;
    v_line_amount := v_issue_qty * v_bom.unit_cost;
    v_total_material := v_total_material + v_line_amount;

    update items set quantity_on_hand = quantity_on_hand - v_issue_qty where id = v_bom.material_item_id;

    insert into stock_movements (item_id, movement_type, qty_change, unit_cost, style_id, memo, posted_entry_id, created_by_name)
    values (v_bom.material_item_id, 'issue', -v_issue_qty, v_bom.unit_cost, p_style_id,
            'Production run — ' || v_style.style_no, v_entry_id, p_created_by_name);
  end loop;

  v_total_cost := v_total_material + v_labor_cost + v_overhead_cost;

  -- Dr Finished Goods Inventory for the full absorbed cost
  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_fg_inv_id, v_total_cost, 0,
          'Production run — ' || v_style.style_no || ' (' || p_qty || ' units)');
  v_line_no := v_line_no + 1;

  -- Cr Raw Material Inventory
  if v_total_material > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_raw_inv_id, 0, v_total_material, 'Materials consumed — ' || v_style.style_no);
    v_line_no := v_line_no + 1;
  end if;

  -- Cr Direct Labor Applied
  if v_labor_cost > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_labor_applied_id, 0, v_labor_cost, 'Labor absorbed — ' || v_style.style_no);
    v_line_no := v_line_no + 1;
  end if;

  -- Cr Manufacturing Overhead Applied
  if v_overhead_cost > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_oh_applied_id, 0, v_overhead_cost, 'Overhead absorbed — ' || v_style.style_no);
  end if;

  update journal_entries set status = 'posted' where id = v_entry_id;
  select entry_number into v_entry_number from journal_entries where id = v_entry_id;

  -- Finished goods: weighted-average blend into the item's running cost.
  v_new_fg_qty := v_fg_item.quantity_on_hand + p_qty;
  v_new_fg_cost := case when v_new_fg_qty > 0
    then ((v_fg_item.quantity_on_hand * v_fg_item.unit_cost) + v_total_cost) / v_new_fg_qty
    else (v_total_cost / p_qty)
  end;
  update items set quantity_on_hand = v_new_fg_qty, unit_cost = round(v_new_fg_cost, 4) where id = v_fg_item.id;

  insert into production_runs (style_id, item_id, qty, material_cost, labor_cost, overhead_cost, total_cost, unit_cost, posted_entry_id, memo, created_by_name, run_date)
  values (p_style_id, v_fg_item.id, p_qty, v_total_material, v_labor_cost, v_overhead_cost, v_total_cost, v_total_cost / p_qty, v_entry_id, p_memo, p_created_by_name, current_date);

  return v_entry_number;
end;
$$ language plpgsql security definer;

-- ============================================================
-- post_invoice_to_ledger (v2) — adds real COGS: for every invoice
-- line selling a style-published finished good, Dr COGS / Cr
-- Finished Goods Inventory at the item's weighted-average cost,
-- and reduces its stock. Blocks posting if stock is insufficient —
-- you can't sell what isn't in Finished Goods.
-- ============================================================
create or replace function post_invoice_to_ledger(p_invoice_id uuid)
returns text as $$
declare
  v_invoice      invoices%rowtype;
  v_entry_id     uuid;
  v_entry_number text;
  v_ar_id        uuid;
  v_vat_id       uuid;
  v_sscl_id      uuid;
  v_revenue_id   uuid;
  v_cogs_id      uuid;
  v_fg_inv_id    uuid;
  v_line_no      int := 2;
  v_il           record;
  v_cogs_amount  numeric;
  v_total_cogs   numeric := 0;
begin
  select * into v_invoice from invoices where id = p_invoice_id;
  if not found then
    raise exception 'Invoice % not found', p_invoice_id;
  end if;

  if v_invoice.posted_entry_id is not null then
    select entry_number into v_entry_number from journal_entries where id = v_invoice.posted_entry_id;
    return v_entry_number;
  end if;

  if v_invoice.status not in ('issued', 'paid') then
    raise exception 'Invoice must be issued before it can be posted to the ledger';
  end if;

  select id into v_ar_id from chart_of_accounts where system_role = 'accounts_receivable';
  select id into v_vat_id from chart_of_accounts where system_role = 'vat_payable';
  select id into v_sscl_id from chart_of_accounts where system_role = 'sscl_payable';
  select id into v_revenue_id from chart_of_accounts where system_role = 'sales_revenue';
  select id into v_cogs_id from chart_of_accounts where system_role = 'cost_of_goods_sold';
  select id into v_fg_inv_id from chart_of_accounts where system_role = 'finished_goods_inventory';

  if v_ar_id is null or v_revenue_id is null then
    raise exception 'Chart of accounts is missing a required system account (Accounts Receivable / Sales Revenue)';
  end if;

  -- Check stock BEFORE posting anything — can't sell what isn't finished.
  for v_il in
    select il.qty, it.name as item_name, it.quantity_on_hand
    from invoice_lines il
    join items it on it.id = il.item_id
    where il.invoice_id = p_invoice_id and it.style_id is not null
  loop
    if v_il.qty > v_il.quantity_on_hand then
      raise exception 'Not enough % in Finished Goods stock: selling %, have %', v_il.item_name, v_il.qty, v_il.quantity_on_hand;
    end if;
  end loop;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (
    v_invoice.invoice_date,
    'Invoice ' || v_invoice.invoice_number || ' — ' || v_invoice.purchaser_name,
    v_invoice.invoice_number,
    'draft', 'invoice', v_invoice.id, v_invoice.created_by_name
  )
  returning id into v_entry_id;

  insert into journal_lines (entry_id, line_no, account_id, customer_id, debit, credit, description)
  values (v_entry_id, 1, v_ar_id, v_invoice.customer_id, v_invoice.total_amount, 0,
          'Invoice ' || v_invoice.invoice_number);

  if v_invoice.subtotal > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_revenue_id, 0, v_invoice.subtotal,
            'Invoice ' || v_invoice.invoice_number || ' — revenue');
    v_line_no := v_line_no + 1;
  end if;

  if v_invoice.sscl_amount > 0 and v_sscl_id is not null then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_sscl_id, 0, v_invoice.sscl_amount,
            'SSCL on ' || v_invoice.invoice_number);
    v_line_no := v_line_no + 1;
  end if;

  if v_invoice.vat_amount > 0 and v_vat_id is not null then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_vat_id, 0, v_invoice.vat_amount,
            'VAT on ' || v_invoice.invoice_number);
    v_line_no := v_line_no + 1;
  end if;

  -- Real COGS: only for lines selling a finished good published from a style.
  if v_cogs_id is not null and v_fg_inv_id is not null then
    for v_il in
      select il.item_id, il.qty, it.unit_cost, it.name as item_name
      from invoice_lines il
      join items it on it.id = il.item_id
      where il.invoice_id = p_invoice_id and it.style_id is not null
    loop
      v_cogs_amount := v_il.qty * v_il.unit_cost;
      v_total_cogs := v_total_cogs + v_cogs_amount;
      update items set quantity_on_hand = quantity_on_hand - v_il.qty where id = v_il.item_id;
      insert into stock_movements (item_id, movement_type, qty_change, unit_cost, memo, posted_entry_id, created_by_name)
      values (v_il.item_id, 'issue', -v_il.qty, v_il.unit_cost, 'Sold on ' || v_invoice.invoice_number, v_entry_id, v_invoice.created_by_name);
    end loop;

    if v_total_cogs > 0 then
      insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
      values (v_entry_id, v_line_no, v_cogs_id, v_total_cogs, 0, 'COGS — ' || v_invoice.invoice_number);
      v_line_no := v_line_no + 1;
      insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
      values (v_entry_id, v_line_no, v_fg_inv_id, 0, v_total_cogs, 'COGS — ' || v_invoice.invoice_number);
    end if;
  end if;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update invoices set posted_entry_id = v_entry_id where id = v_invoice.id;

  select entry_number into v_entry_number from journal_entries where id = v_entry_id;
  return v_entry_number;
end;
$$ language plpgsql security definer;
