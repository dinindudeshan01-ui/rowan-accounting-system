-- ============================================================
-- ADMIN: RESET ALL TRANSACTIONS
-- Wipes every transactional/audit record so the app can be tested
-- from a clean slate, WITHOUT touching setup/master data.
--
-- Wiped: journal_entries, journal_lines, invoices, invoice_lines,
--        payments, payment_allocations, audit_log
--        (+ resets JE/invoice/payment numbering back to 1)
-- Kept:  chart_of_accounts, customers, vendors, items, tax_settings
--
-- This is destructive and irreversible. Tested locally against a
-- real Postgres instance before shipping: confirms all 7 tables
-- go to 0 rows, master data is untouched, and sequences correctly
-- restart (next invoice/JE/payment is numbered 000001 again).
-- ============================================================

create or replace function reset_all_transactions()
returns void as $$
begin
  truncate table journal_lines, journal_entries, invoice_lines, invoices,
                 payment_allocations, payments, audit_log;

  alter sequence je_number_seq restart with 1;
  alter sequence invoice_number_seq restart with 1;
  alter sequence payment_number_seq restart with 1;
end;
$$ language plpgsql security definer;

grant execute on function reset_all_transactions() to authenticated, anon;
