-- ============================================================
-- STOCK ADJUSTMENT
-- Closes a real gap: the `adjustment` movement_type has existed in
-- stock_movements since 021, but nothing in the app could ever post
-- one — a physical count coming up short/over than the books had no
-- way to be corrected except editing quantity_on_hand directly (no
-- audit trail, no GL entry).
--
-- adjust_stock() posts a proper journal entry either way:
--   shortage (qty_change < 0): Dr Stock Adjustments (expense) / Cr Inventory
--   overage  (qty_change > 0): Dr Inventory / Cr Stock Adjustments (expense, contra)
-- against whichever inventory account fits the item (raw material
-- 'inventory' vs finished good 'finished_goods_inventory').
-- ============================================================

insert into chart_of_accounts (code, name, type, subtype, system_role) values
  ('5420', 'Stock Adjustments / Write-offs', 'expense', 'Inventory Adjustments', 'stock_adjustment_expense')
on conflict (code) do nothing;

create or replace function adjust_stock(
  p_item_id         uuid,
  p_qty_change      numeric,
  p_reason          text,
  p_created_by_name text
) returns text as $$
declare
  v_item          items%rowtype;
  v_inv_account   uuid;
  v_var_account   uuid;
  v_amount        numeric;
  v_entry_id      uuid;
  v_entry_number  text;
begin
  if p_qty_change = 0 then
    raise exception 'Adjustment quantity can''t be zero';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required for every stock adjustment';
  end if;

  select * into v_item from items where id = p_item_id;
  if not found then
    raise exception 'Item not found';
  end if;

  if v_item.quantity_on_hand + p_qty_change < 0 then
    raise exception 'That would take % below zero (currently %)', v_item.name, v_item.quantity_on_hand;
  end if;

  select id into v_inv_account from chart_of_accounts
    where system_role = case when v_item.style_id is not null then 'finished_goods_inventory' else 'inventory' end;
  select id into v_var_account from chart_of_accounts where system_role = 'stock_adjustment_expense';

  if v_inv_account is null or v_var_account is null then
    raise exception 'Required system accounts not found — run the stock adjustment migration';
  end if;

  v_amount := abs(p_qty_change) * v_item.unit_cost;

  update items set quantity_on_hand = quantity_on_hand + p_qty_change where id = p_item_id;

  insert into stock_movements (item_id, movement_type, qty_change, unit_cost, memo, created_by_name)
  values (p_item_id, 'adjustment', p_qty_change, v_item.unit_cost, p_reason, p_created_by_name);

  if v_amount > 0 then
    insert into journal_entries (entry_date, memo, status, source_type, source_id, created_by_name)
    values (current_date, 'Stock adjustment — ' || v_item.name || ': ' || p_reason, 'draft', 'inventory_adjustment', p_item_id, p_created_by_name)
    returning id into v_entry_id;

    if p_qty_change < 0 then
      insert into journal_lines (entry_id, line_no, account_id, debit, credit, description) values
        (v_entry_id, 1, v_var_account, v_amount, 0, 'Shortage — ' || v_item.name || ' (' || p_reason || ')'),
        (v_entry_id, 2, v_inv_account, 0, v_amount, 'Shortage — ' || v_item.name);
    else
      insert into journal_lines (entry_id, line_no, account_id, debit, credit, description) values
        (v_entry_id, 1, v_inv_account, v_amount, 0, 'Overage — ' || v_item.name || ' (' || p_reason || ')'),
        (v_entry_id, 2, v_var_account, 0, v_amount, 'Overage — ' || v_item.name);
    end if;

    update journal_entries set status = 'posted' where id = v_entry_id;
    select entry_number into v_entry_number from journal_entries where id = v_entry_id;
  else
    v_entry_number := null;
  end if;

  return coalesce(v_entry_number, 'no GL entry (zero-cost item)');
end;
$$ language plpgsql security definer;

grant execute on function adjust_stock(uuid, numeric, text, text) to authenticated, anon;
