-- ============================================================
-- LADY J IMPORTS — BACKFILL customer_id + item_id
--
-- Every Lady J scan import (027: #1-400, 031: #401-450) inserted
-- invoices/invoice_lines with only free-text purchaser_name /
-- description — customer_id and item_id were never set on any of
-- them. That means these ~450 invoices are invisible to the
-- Customer Center's Transactions tab and to any item/style-based
-- reporting, and each repeated garment (e.g. "Blooming Bay C/Neck
-- Mens") exists only as scattered text instead of one catalog item
-- with a real stock quantity.
--
-- This migration is idempotent and covers ALL source='lady_j_scan'
-- rows (not just 401-450 — 1-400 has the exact same gap):
--
-- 1. Customer: finds-or-creates the "Lady J, Maharagama" customer
--    and links every invoice missing customer_id.
--
-- 2. Items/styles: for each invoice_line with item_id still null,
--    tries to match an existing item by its scan code (invoice_lines
--    .code, e.g. '9877') first, then by exact description text —
--    so repeats of the same garment collapse onto one item instead
--    of duplicating. When no match exists anywhere, creates a new
--    `styles` row (style_no = the scan code if present, else a
--    generated LJ-NEW-n) and publishes it to the item catalog via
--    the existing publish_style_to_catalog() function, then links
--    the line to that new item.
--
-- NOT done here, on purpose: this does not retroactively decrement
-- quantity_on_hand for these historical sales. No production run
-- was ever recorded for legacy #1-450 either (produce_style() was
-- never called for them), so backdating stock issues now would just
-- push these items to large, meaningless negative quantities rather
-- than reflect anything real. Going forward, new sales should be
-- preceded by a production run so quantity_on_hand stays meaningful.
-- If you want historical quantities reconciled some other way (e.g.
-- a one-time stock adjustment per style), that's a separate,
-- deliberate step — flag it and we can do it properly.
-- ============================================================

do $$
declare
  v_customer_id uuid;
  v_line        record;
  v_item_id     uuid;
  v_style_id    uuid;
  v_style_no    text;
  v_seq         int := 0;
  v_linked      int := 0;
  v_created     int := 0;
begin
  -- ---------- 1. Customer link ----------
  select id into v_customer_id from customers where display_name = 'Lady J, Maharagama';

  if v_customer_id is null then
    insert into customers (display_name, city)
    values ('Lady J, Maharagama', 'Maharagama')
    returning id into v_customer_id;
  end if;

  update invoices
    set customer_id = v_customer_id
    where source = 'lady_j_scan'
      and customer_id is null;

  -- ---------- 2. Item / style link ----------
  for v_line in
    select il.id as line_id, il.code, il.description, il.unit_price
    from invoice_lines il
    join invoices inv on inv.id = il.invoice_id
    where inv.source = 'lady_j_scan'
      and il.item_id is null
    order by inv.legacy_id nulls last, il.line_no
  loop
    v_item_id := null;

    -- Match by scan code first (real style numbers like '9877').
    if v_line.code is not null and v_line.code <> 'N/A' then
      select id into v_item_id from items where code = v_line.code;
    end if;

    -- Fall back to exact description match (case/whitespace-insensitive)
    -- so re-used free-text names collapse onto the same item.
    if v_item_id is null then
      select id into v_item_id
      from items
      where lower(trim(name)) = lower(trim(v_line.description))
      limit 1;
    end if;

    -- Nothing matched anywhere — this is a genuinely new style.
    if v_item_id is null then
      v_style_no := nullif(v_line.code, 'N/A');

      if v_style_no is null then
        v_seq := v_seq + 1;
        v_style_no := 'LJ-NEW-' || v_seq::text;
      end if;

      -- Guard against colliding with a style_no created earlier in
      -- this same loop (or already present for an unrelated reason).
      while exists (select 1 from styles where style_no = v_style_no) loop
        v_seq := v_seq + 1;
        v_style_no := coalesce(nullif(v_line.code, 'N/A'), 'LJ-NEW') || '-' || v_seq::text;
      end loop;

      insert into styles (style_no, name, category, selling_price, status, notes)
      values (
        v_style_no,
        v_line.description,
        'Lady J Garments',
        v_line.unit_price,
        'active',
        'Auto-created from Lady J scan backfill (sql/034)'
      )
      returning id into v_style_id;

      v_item_id := publish_style_to_catalog(v_style_id);
      v_created := v_created + 1;
    end if;

    update invoice_lines set item_id = v_item_id where id = v_line.line_id;
    v_linked := v_linked + 1;
  end loop;

  raise notice 'Lady J backfill: % invoice lines linked, % new styles created', v_linked, v_created;
end $$;
