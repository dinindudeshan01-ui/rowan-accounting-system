-- ============================================================
-- Fixes: 'update or delete on table "journal_entries" violates
-- foreign key constraint "stock_movements_posted_entry_id_fkey"'
--
-- Posting an invoice (023) takes finished goods out of stock and
-- writes an 'issue' row in stock_movements pointing at the
-- invoice's journal entry. delete_invoice() removed the journal
-- entry without removing those stock rows, so Postgres refused.
--
-- Now, deleting an invoice also:
--   1. puts the sold quantities back into items.quantity_on_hand
--   2. deletes the stock movements the invoice created
--   3. then removes the journal entry and the invoice
--
-- Supersedes 039. Safe to run more than once.
-- ============================================================
create or replace function delete_invoice(p_invoice_id uuid)
returns void as $$
declare
  v_entry_id uuid;
  v_mv record;
begin
  if not exists (select 1 from invoices where id = p_invoice_id) then
    raise exception 'Invoice not found — it may already have been deleted.';
  end if;

  if exists (select 1 from payment_allocations where invoice_id = p_invoice_id) then
    raise exception 'This invoice has payments applied to it. Reverse or delete the payment first, then delete the invoice.';
  end if;

  select posted_entry_id into v_entry_id from invoices where id = p_invoice_id;

  if v_entry_id is not null then
    -- Return sold goods to stock (qty_change is negative for issues).
    for v_mv in
      select item_id, qty_change from stock_movements where posted_entry_id = v_entry_id
    loop
      update items
        set quantity_on_hand = quantity_on_hand - v_mv.qty_change
        where id = v_mv.item_id;
    end loop;

    delete from stock_movements where posted_entry_id = v_entry_id;

    update invoices set posted_entry_id = null where id = p_invoice_id;
    delete from journal_entries where id = v_entry_id; -- cascades journal_lines
  end if;

  delete from invoices where id = p_invoice_id; -- cascades invoice_lines
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function delete_invoice(uuid) to authenticated, anon;

notify pgrst, 'reload schema';
