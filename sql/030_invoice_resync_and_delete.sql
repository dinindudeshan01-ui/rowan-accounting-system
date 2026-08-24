-- ============================================================
-- FIX #1: post_invoice_to_ledger() was write-once. Editing an
-- already-issued invoice (qty/price/etc changes) updated the
-- invoices row but silently left the old journal_lines amounts
-- in place forever, so P&L / Balance Sheet never picked up the
-- correction. Now it re-syncs the existing journal entry's lines
-- to the invoice's current totals on every save instead of
-- no-op'ing once posted_entry_id is set.
--
-- FIX #2: invoices had no delete path. delete_invoice() removes
-- the invoice (and its lines, via existing cascade) and, if it
-- was posted, also removes the journal entry it created — in the
-- right order to satisfy the invoices.posted_entry_id FK — so no
-- orphaned ledger entries are left distorting P&L / Balance Sheet.
-- ============================================================

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

  -- Already posted: re-sync the existing entry's lines to the
  -- invoice's current amounts instead of leaving them stale.
  if v_invoice.posted_entry_id is not null then
    v_entry_id := v_invoice.posted_entry_id;

    delete from journal_lines where entry_id = v_entry_id;

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
    end if;

    update journal_entries
      set memo = 'Invoice ' || v_invoice.invoice_number || ' — ' || v_invoice.purchaser_name,
          entry_date = v_invoice.invoice_date
      where id = v_entry_id;

    select entry_number into v_entry_number from journal_entries where id = v_entry_id;
    return v_entry_number;
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
  end if;

  update journal_entries set status = 'posted' where id = v_entry_id;
  update invoices set posted_entry_id = v_entry_id where id = v_invoice.id;

  select entry_number into v_entry_number from journal_entries where id = v_entry_id;
  return v_entry_number;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Safe invoice delete: removes the invoice's posted journal entry
-- first (breaking invoices.posted_entry_id's reference to it so
-- the FK doesn't block the delete), then removes the invoice
-- itself (invoice_lines cascade automatically per 008's FK).
-- ============================================================
create or replace function delete_invoice(p_invoice_id uuid)
returns void as $$
declare
  v_entry_id uuid;
begin
  select posted_entry_id into v_entry_id from invoices where id = p_invoice_id;

  if v_entry_id is not null then
    update invoices set posted_entry_id = null where id = p_invoice_id;
    delete from journal_entries where id = v_entry_id; -- cascades journal_lines
  end if;

  delete from invoices where id = p_invoice_id; -- cascades invoice_lines
end;
$$ language plpgsql security definer;

grant execute on function post_invoice_to_ledger(uuid) to authenticated, anon;
grant execute on function delete_invoice(uuid) to authenticated, anon;
