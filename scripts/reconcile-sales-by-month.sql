-- ============================================================
-- Find why the dashboard / invoices and the P&L disagree for a month.
-- Read-only: only SELECTs. Run in the Supabase SQL editor, one block at a time.
--
-- The P&L ("Sales Revenue") = posted journal entries, grouped by the
-- JOURNAL ENTRY date. Invoices are grouped by INVOICE date. They only
-- agree if every issued/paid invoice has been posted AND its journal
-- entry date still equals its invoice date.
-- ============================================================

-- 1) Month by month: invoices vs ledger. Look for rows where difference <> 0.
with inv as (
  select date_trunc('month', invoice_date)::date as month,
         count(*) as invoices,
         sum(subtotal) as invoiced
  from invoices
  where status in ('issued', 'paid')
  group by 1
),
led as (
  select date_trunc('month', je.entry_date)::date as month,
         sum(jl.credit - jl.debit) as ledger
  from journal_lines jl
  join journal_entries je on je.id = jl.entry_id
  join chart_of_accounts ca on ca.id = jl.account_id
  where je.status = 'posted' and ca.type = 'revenue'
  group by 1
)
select coalesce(inv.month, led.month) as month,
       inv.invoices,
       inv.invoiced,
       led.ledger,
       coalesce(inv.invoiced, 0) - coalesce(led.ledger, 0) as difference
from inv
full join led on led.month = inv.month
order by 1;

-- 2) Invoices that were NEVER posted to the ledger (so they are missing from the P&L).
select invoice_number, invoice_date, status, source, subtotal, total_amount
from invoices
where status in ('issued', 'paid')
  and posted_entry_id is null
order by invoice_date;

-- 3) Invoices whose ledger date differs from their invoice date
--    (date edited after posting, or posted before the dates were corrected).
select i.invoice_number,
       i.invoice_date,
       je.entry_date as ledger_date,
       i.subtotal,
       je.status as ledger_status
from invoices i
join journal_entries je on je.id = i.posted_entry_id
where je.entry_date <> i.invoice_date
order by i.invoice_date;

-- 4) Everything dated April 2026, with its ledger status (change the dates for another month).
select i.invoice_number,
       i.invoice_date,
       i.source,
       i.subtotal,
       i.posted_entry_id is not null as posted,
       je.entry_date as ledger_date,
       je.status as ledger_status
from invoices i
left join journal_entries je on je.id = i.posted_entry_id
where i.status in ('issued', 'paid')
  and i.invoice_date >= '2026-04-01'
  and i.invoice_date <  '2026-05-01'
order by (je.entry_date is distinct from i.invoice_date) desc, i.subtotal desc;
