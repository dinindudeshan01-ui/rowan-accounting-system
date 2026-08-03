-- ============================================================
-- GRANULAR ACCOUNT SUBTYPES (Assets/Liabilities/Equity/Revenue)
--
-- 016 gave expenses proper CA classification (Direct Materials /
-- Labor / Expenses / Manufacturing Overhead / period costs). This
-- does the same for the rest of the chart — "Current Asset" alone
-- doesn't tell you if something's cash, a bank account, or stock.
--
-- "Cash and Bank" (1002) is genuinely ambiguous — a business needs
-- to reconcile its bank account separately from petty cash, so it's
-- split the same way 016 handled ambiguous expense accounts:
-- deactivated (keeps historical postings intact, hidden from new
-- entries) with two clear replacements added.
-- ============================================================

update chart_of_accounts set subtype = 'Accounts Receivable' where code = '1001';
update chart_of_accounts set subtype = 'Bank', is_active = false where code = '1002'; -- ambiguous cash+bank, see above
update chart_of_accounts set subtype = 'Inventory' where code = '1003';

insert into chart_of_accounts (code, name, type, subtype) values
  ('1004', 'Cash in Hand', 'asset', 'Cash'),
  ('1005', 'Bank Account — Current', 'asset', 'Bank');

update chart_of_accounts set subtype = 'Accounts Payable' where code = '2002';
update chart_of_accounts set subtype = 'Tax Payable'
  where code in ('2001', '2003', '2004', '2005', '2006'); -- APIT / EPF / ETF / SSCL / VAT Payable

update chart_of_accounts set subtype = 'Operating Revenue' where code = '4001';
