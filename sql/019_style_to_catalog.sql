-- ============================================================
-- STYLE → SALES CATALOG (the missing flow step)
--
-- Styles and items were two disconnected tables — creating a style
-- with full BOM/costing never produced anything an invoice could
-- select, because invoice lines pull from `items`, not `styles`.
-- There was no step that turned a costed style into something
-- sellable.
--
-- This adds that step: publish_style_to_catalog() takes a style,
-- computes its rolled-up unit cost from the BOM + labor + overhead
-- (same formula the Style page already shows), and upserts a
-- matching `items` row (item_type = 'inventory') so it appears in
-- the invoice line picker immediately.
--
-- items.style_id links back so re-publishing (after editing BOM or
-- price) UPDATES the same item instead of creating a duplicate.
-- ============================================================

alter table items add column if not exists style_id uuid references styles(id) on delete set null;
create unique index if not exists idx_items_style_id on items (style_id) where style_id is not null;

create or replace function publish_style_to_catalog(p_style_id uuid)
returns uuid as $$
declare
  v_style        styles%rowtype;
  v_material_cost numeric := 0;
  v_unit_cost     numeric;
  v_income_id     uuid;
  v_item_id       uuid;
begin
  select * into v_style from styles where id = p_style_id;
  if not found then
    raise exception 'Style % not found', p_style_id;
  end if;

  select coalesce(sum(consumption_qty * unit_cost * (1 + wastage_pct / 100.0)), 0)
    into v_material_cost
    from style_bom_lines
    where style_id = p_style_id;

  v_unit_cost := v_material_cost + v_style.labor_cost_per_unit + v_style.overhead_cost_per_unit;

  select id into v_income_id from chart_of_accounts where system_role = 'sales_revenue';

  select id into v_item_id from items where style_id = p_style_id;

  if v_item_id is null then
    insert into items (code, name, description, item_type, unit_price, unit_cost, income_account_id, style_id)
    values (v_style.style_no, v_style.name, v_style.category, 'inventory', v_style.selling_price, v_unit_cost, v_income_id, p_style_id)
    returning id into v_item_id;
  else
    update items
    set name = v_style.name,
        description = v_style.category,
        unit_price = v_style.selling_price,
        unit_cost = v_unit_cost,
        is_active = true
    where id = v_item_id;
  end if;

  return v_item_id;
end;
$$ language plpgsql security definer;

grant execute on function publish_style_to_catalog(uuid) to authenticated, anon;
