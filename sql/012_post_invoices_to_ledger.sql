-- ============================================================
-- POST INVOICES TO THE LEDGER
-- Closes the gap where an "issued" invoice was just a document —
-- it never touched journal_entries, so P&L never saw the revenue
-- and the Customer Center's balance (which reads journal_lines by
-- customer_id) never moved either. This migration:
--   1. Tags key chart_of_accounts rows with a stable system_role,
--      so posting logic survives account renumbering/renaming
--      (007 already proved codes aren't stable; names could change
--      too, so we don't hardcode either).
--   2. Snapshots subtotal/sscl/vat/total onto the invoice itself —
--      same reasoning as snapshotting purchaser name/address: the
--      invoice shouldn't silently reprice if rates change later,
--      and the ledger posting should use the exact numbers the
--      customer was actually billed, not a recomputation that could
--      drift from JS floating point vs Postgres numeric arithmetic.
--   3. post_invoice_to_ledger(): idempotent — safe to call every
--      time an invoice is saved as "issued"; only posts once.
-- ============================================================

alter table chart_of_accounts add column if not exists system_role text unique;

update chart_of_accounts set system_role = 'accounts_receivable' where name = 'Accounts Receivable' and system_role is null;
update chart_of_accounts set system_role = 'vat_payable' where name = 'VAT Payable' and system_role is null;
update chart_of_accounts set system_role = 'sscl_payable' where name = 'SSCL Payable' and system_role is null;
update chart_of_accounts set system_role = 'sales_revenue' where name = 'Sales Revenue' and system_role is null;

alter table invoices
  add column if not exists subtotal numeric(14,2) not null default 0,
  add column if not exists sscl_amount numeric(14,2) not null default 0,
  add column if not exists vat_amount numeric(14,2) not null default 0,
  add column if not exists total_amount numeric(14,2) not null default 0,
  add column if not exists posted_entry_id uuid references journal_entries(id);

create or replace function post_invoice_to_ledger(p_invoice_id uuid)
returns text as $$
declare
  v_invoice invoices%rowtype;
  v_entry_id uuid;
  v_entry_number text;
  v_ar_id uuid;
  v_vat_id uuid;
  v_sscl_id uuid;
  v_revenue_id uuid;
  v_line_no int := 2;
begin
  select * into v_invoice from invoices where id = p_invoice_id;
  if not found then
    raise exception 'Invoice % not found', p_invoice_id;
  end if;

  -- Already posted: idempotent no-op, just hand back the existing entry number.
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

  if v_ar_id is null or v_revenue_id is null then
    raise exception 'Chart of accounts is missing a required system account (Accounts Receivable / Sales Revenue)';
  end if;

  insert into journal_entries (entry_date, memo, reference, status, source_type, source_id, created_by_name)
  values (
    v_invoice.invoice_date,
    'Invoice ' || v_invoice.invoice_number || ' — ' || v_invoice.purchaser_name,
    v_invoice.invoice_number,
    'draft',
    'invoice',
    v_invoice.id,
    v_invoice.created_by_name
  )
  returning id into v_entry_id;

  -- Debit: Accounts Receivable for the full amount owed, tagged to the
  -- customer so the Customer Center balance/transactions tab picks it up.
  insert into journal_lines (entry_id, line_no, account_id, customer_id, debit, credit, description)
  values (v_entry_id, 1, v_ar_id, v_invoice.customer_id, v_invoice.total_amount, 0,
          'Invoice ' || v_invoice.invoice_number);

  -- Credit: revenue (subtotal, excluding tax)
  if v_invoice.subtotal > 0 then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_revenue_id, 0, v_invoice.subtotal,
            'Invoice ' || v_invoice.invoice_number || ' — revenue');
    v_line_no := v_line_no + 1;
  end if;

  -- Credit: SSCL payable, if this invoice charged it
  if v_invoice.sscl_amount > 0 and v_sscl_id is not null then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_sscl_id, 0, v_invoice.sscl_amount,
            'SSCL on ' || v_invoice.invoice_number);
    v_line_no := v_line_no + 1;
  end if;

  -- Credit: VAT payable, if this invoice charged it
  if v_invoice.vat_amount > 0 and v_vat_id is not null then
    insert into journal_lines (entry_id, line_no, account_id, debit, credit, description)
    values (v_entry_id, v_line_no, v_vat_id, 0, v_invoice.vat_amount,
            'VAT on ' || v_invoice.invoice_number);
  end if;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update invoices set posted_entry_id = v_entry_id where id = v_invoice.id;

  select entry_number into v_entry_number from journal_entries where id = v_entry_id;
  return v_entry_number;
end;
$$ language plpgsql security definer;

grant execute on function post_invoice_to_ledger(uuid) to authenticated, anon;
