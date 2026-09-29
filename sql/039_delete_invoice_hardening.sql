-- ============================================================
-- Re-creates delete_invoice() so invoice deletion works even if
-- 030 was never run on this database, and gives clear messages
-- instead of raw foreign-key errors.
--
-- Safe to run more than once (create or replace).
--   * Drafts: deleted straight away.
--   * Issued/posted: its journal entry is removed first.
--   * Invoices with payments applied are refused with a plain
--     message (reverse the payment first) instead of a FK error.
-- Ends with a PostgREST schema reload — a function that exists
-- but is not in the API cache also shows up as "cannot delete".
-- ============================================================
create or replace function delete_invoice(p_invoice_id uuid)
returns void as $$
declare
  v_entry_id uuid;
begin
  if not exists (select 1 from invoices where id = p_invoice_id) then
    raise exception 'Invoice not found — it may already have been deleted.';
  end if;

  if exists (select 1 from payment_allocations where invoice_id = p_invoice_id) then
    raise exception 'This invoice has payments applied to it. Reverse or delete the payment first, then delete the invoice.';
  end if;

  select posted_entry_id into v_entry_id from invoices where id = p_invoice_id;

  if v_entry_id is not null then
    update invoices set posted_entry_id = null where id = p_invoice_id;
    delete from journal_entries where id = v_entry_id; -- cascades journal_lines
  end if;

  delete from invoices where id = p_invoice_id; -- cascades invoice_lines
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function delete_invoice(uuid) to authenticated, anon;

notify pgrst, 'reload schema';
