-- ============================================================
-- PRODUCE STYLE — auto-consume BOM
--
-- Closes the manual gap: previously "producing" a style meant
-- issuing each BOM material one at a time via Issue Stock. This
-- does it in one atomic action: enter a style + quantity, and every
-- BOM line is consumed in the right amount (consumption_qty ×
-- (1 + wastage%) × production qty), validated against actual stock
-- BEFORE anything is touched — a production run either fully
-- succeeds or fully fails, never half-consumes materials.
--
-- Design choice, stated plainly: this does NOT capitalize the
-- finished good's value onto the balance sheet as a separate
-- Finished Goods Inventory entry. Raw materials are still expensed
-- via Dr [item's classified expense account] / Cr Raw Material
-- Inventory — the same treatment issue_stock() already uses,
-- consistent with the Manufacturing Account on the Reports page
-- (which already treats Direct Materials/Labor/Overhead as period
-- costs, not WIP-then-capitalized costs). The finished good's
-- quantity_on_hand still increases (for stock-level visibility and
-- so Invoice can eventually check availability) — it's a quantity
-- record, not a separate valued GL entry. Full WIP/FG capitalization
-- with labor & overhead absorption is a legitimate next step if
-- audited financials ever need it, but is a materially bigger
-- feature (variance accounts, absorption accounting) than what's
-- being asked for here.
-- ============================================================

create or replace function produce_style(
  p_style_id        uuid,
  p_qty             numeric,
  p_memo            text,
  p_created_by_name text
) returns text as $$
declare
  v_style          styles%rowtype;
  v_fg_item_id     uuid;
  v_inventory_id   uuid;
  v_bom_count      int;
  v_bom            record;
  v_issue_qty      numeric;
  v_line_amount    numeric;
  v_total_material numeric := 0;
  v_entry_id       uuid;
  v_entry_number   text;
  v_line_no        int := 1;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_style from styles where id = p_style_id;
  if not found then
    raise exception 'Style not found';
  end if;

  select id into v_fg_item_id from items where style_id = p_style_id;
  if v_fg_item_id is null then
    raise exception 'Publish this style to the sales catalog first (Costing tab) before producing it';
  end if;

  select count(*) into v_bom_count from style_bom_lines where style_id = p_style_id;
  if v_bom_count = 0 then
    raise exception 'This style has no Bill of Materials — add one before producing';
  end if;

  select id into v_inventory_id from chart_of_accounts where system_role = 'inventory';
  if v_inventory_id is null then
    raise exception 'Inventory system account not found';
  end if;

  -- Validate EVERY line before touching anything — all-or-nothing.
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
    if v_bom.expense_account_id is null then
      raise exception 'Material "%" has no expense account set — edit the item first', v_bom.item_name;
    end if;
    v_issue_qty := v_bom.consumption_qty * (1 + v_bom.wastage_pct / 100.0) * p_qty;
    if v_issue_qty > v_bom.quantity_on_hand then
      raise exception 'Not enough % in stock: need %, have %', v_bom.item_name, round(v_issue_qty, 3), v_bom.quantity_on_hand;
    end if;
  end loop;

  insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
  values (
    current_date,
    coalesce(p_memo, 'Production run — ' || v_style.style_no || ' × ' || p_qty),
    'draft', 'inventory_adjustment', p_style_id, p_created_by_name
  )
  returning id into v_entry_id;

  for v_bom in
    select bl.material_name, bl.consumption_qty, bl.wastage_pct, bl.item_id as material_item_id,
           it.unit_cost, it.expense_account_id
    from style_bom_lines bl
    join items it on it.id = bl.item_id
    where bl.style_id = p_style_id
  loop
    v_issue_qty := v_bom.consumption_qty * (1 + v_bom.wastage_pct / 100.0) * p_qty;
    v_line_amount := v_issue_qty * v_bom.unit_cost;
    v_total_material := v_total_material + v_line_amount;

    update items set quantity_on_hand = quantity_on_hand - v_issue_qty where id = v_bom.material_item_id;

    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_bom.expense_account_id, v_line_amount, 0,
            'Consumed for ' || v_style.style_no || ': ' || v_bom.material_name);
    v_line_no := v_line_no + 1;

    insert into stock_movements (item_id, movement_type, qty_change, unit_cost, style_id, memo, posted_entry_id, created_by_name)
    values (v_bom.material_item_id, 'issue', -v_issue_qty, v_bom.unit_cost, p_style_id,
            'Production run — ' || v_style.style_no, v_entry_id, p_created_by_name);
  end loop;

  insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
  values (v_entry_id, v_line_no, v_inventory_id, 0, v_total_material, 'Production run — ' || v_style.style_no);

  update journal_entries set status = 'posted' where id = v_entry_id;
  select entry_number into v_entry_number from journal_entries where id = v_entry_id;

  -- Finished goods quantity increases — no separate valued GL line (see note above).
  update items set quantity_on_hand = quantity_on_hand + p_qty where id = v_fg_item_id;

  insert into stock_movements (item_id, movement_type, qty_change, unit_cost, style_id, memo, posted_entry_id, created_by_name)
  values (v_fg_item_id, 'receipt', p_qty, v_style.labor_cost_per_unit + v_style.overhead_cost_per_unit,
          p_style_id, coalesce(p_memo, 'Production run'), v_entry_id, p_created_by_name);

  return v_entry_number;
end;
$$ language plpgsql security definer;

grant execute on function produce_style(uuid, numeric, text, text) to authenticated, anon;
