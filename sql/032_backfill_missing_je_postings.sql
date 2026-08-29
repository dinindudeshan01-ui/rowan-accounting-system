-- ============================================================
-- BACKFILL: post every issued/paid invoice that never got a
-- journal entry.
--
-- Root cause: the bulk Lady J imports (027, 031) inserted rows
-- straight into `invoices` with plain INSERTs and never called
-- post_invoice_to_ledger(). The normal app flow (app/accounting/
-- invoice/page.tsx) already calls that function on save, so this
-- only affects invoices that were imported directly via SQL.
-- Those invoices' revenue never reached journal_entries, so they
-- never showed up in P&L.
--
-- post_invoice_to_ledger() is idempotent (no-ops if posted_entry_id
-- is already set) and already refuses to post anything that isn't
-- 'issued' or 'paid', so this is safe to run more than once and
-- correctly leaves 'draft'/'void' invoices out of the ledger.
-- ============================================================

do $$
declare
  v_invoice record;
  v_posted int := 0;
  v_failed int := 0;
  v_entry_number text;
begin
  for v_invoice in
    select id, invoice_number
    from invoices
    where status in ('issued', 'paid')
      and posted_entry_id is null
    order by invoice_date
  loop
    begin
      select post_invoice_to_ledger(v_invoice.id) into v_entry_number;
      v_posted := v_posted + 1;
    exception when others then
      v_failed := v_failed + 1;
      raise notice 'Failed to post invoice % (%): %', v_invoice.invoice_number, v_invoice.id, sqlerrm;
    end;
  end loop;

  raise notice 'Backfill complete: % invoice(s) posted, % failed', v_posted, v_failed;
end $$;

-- Sanity check after running: this should return 0 rows.
-- select id, invoice_number, status from invoices
-- where status in ('issued','paid') and posted_entry_id is null;
