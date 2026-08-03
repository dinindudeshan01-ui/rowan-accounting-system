-- ============================================================
-- MANUFACTURING COST CLASSIFICATION (CA / LKAS 2 aligned)
--
-- A garment factory's costs are NOT a flat expense list. Per LKAS 2
-- (Inventories), the cost of finished goods must include: direct
-- materials, direct labor, and a systematic allocation of production
-- overheads. Everything else (selling, admin, finance) is a PERIOD
-- cost — expensed immediately, never part of inventory/COGS.
--
-- This migration:
--   1. Builds a proper account set under four manufacturing subtypes
--      (Direct Materials / Direct Labor / Direct Expenses /
--      Manufacturing Overhead) that together build up Cost of Goods
--      Manufactured, plus three period-cost subtypes (Selling &
--      Distribution / Administrative Expense / Finance Cost).
--   2. Reclassifies the old generic accounts (Rent Expense, Salary
--      Expense, Utilities Expense, etc.) — these were ambiguous
--      (factory or office?), so rather than guess and silently
--      misclassify your history, they're DEACTIVATED (is_active =
--      false) with a best-guess subtype applied so past reports
--      still group sensibly. is_active = false only hides them from
--      NEW entries — nothing about historical postings changes.
--      ⚠ If you have real transactions posted to 5004/5005/5006,
--      it's worth reviewing whether those were factory or office
--      costs and, if it matters for a specific period, moving them
--      to the correct new account.
--   3. Adds subtype dropdowns for the other account types too
--      (asset/liability/equity/revenue), so the whole chart stays
--      disciplined, not just expenses.
-- ============================================================

-- ---------- reclassify + deactivate the old ambiguous accounts ----------
update chart_of_accounts set subtype = 'Direct Materials', is_active = false
  where code = '5001'; -- old catch-all "Cost of Goods Sold"
update chart_of_accounts set subtype = 'Administrative Expense', is_active = false
  where code = '5002'; -- old catch-all "General & Admin Expense"
update chart_of_accounts set subtype = 'Manufacturing Overhead', is_active = false
  where code = '5004'; -- old "Rent Expense" — factory or office? unclear, review recommended
update chart_of_accounts set subtype = 'Manufacturing Overhead', is_active = false
  where code = '5005'; -- old "Salary Expense" — factory or office? unclear, review recommended
update chart_of_accounts set subtype = 'Manufacturing Overhead', is_active = false
  where code = '5006'; -- old "Utilities Expense" — factory or office? unclear, review recommended

-- 5003 "Office Supplies" is unambiguous — keep it active, just reclassify.
update chart_of_accounts set subtype = 'Administrative Expense'
  where code = '5003';

-- ---------- Direct Materials ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('5101', 'Fabric & Piece Goods',              'expense', 'Direct Materials'),
  ('5102', 'Trims & Accessories',                'expense', 'Direct Materials'),
  ('5103', 'Packing Materials',                  'expense', 'Direct Materials');

-- ---------- Direct Labor ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('5201', 'Cutting Wages',                      'expense', 'Direct Labor'),
  ('5202', 'Sewing / Machine Operator Wages',    'expense', 'Direct Labor'),
  ('5203', 'Finishing & Packing Wages',          'expense', 'Direct Labor');

-- ---------- Direct Expenses (traceable to a specific job/order) ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('5301', 'Subcontracting Charges',             'expense', 'Direct Expenses'),
  ('5302', 'Job-Specific Freight & Duty',        'expense', 'Direct Expenses');

-- ---------- Manufacturing Overhead (indirect production costs) ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('5401', 'Factory Rent & Rates',               'expense', 'Manufacturing Overhead'),
  ('5402', 'Factory Electricity & Water',        'expense', 'Manufacturing Overhead'),
  ('5403', 'Machine Maintenance & Repairs',      'expense', 'Manufacturing Overhead'),
  ('5404', 'Depreciation — Plant & Machinery',   'expense', 'Manufacturing Overhead'),
  ('5405', 'Factory Supervision Salaries',       'expense', 'Manufacturing Overhead'),
  ('5406', 'Consumables & Indirect Materials',   'expense', 'Manufacturing Overhead'),
  ('5407', 'Quality Assurance & Testing',        'expense', 'Manufacturing Overhead');

-- ---------- Selling & Distribution (period cost) ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('6101', 'Sales Commission',                   'expense', 'Selling & Distribution'),
  ('6102', 'Marketing & Advertising',             'expense', 'Selling & Distribution'),
  ('6103', 'Delivery & Freight Outward',         'expense', 'Selling & Distribution');

-- ---------- Administrative Expense (period cost) ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('6201', 'Office Salaries',                    'expense', 'Administrative Expense'),
  ('6202', 'Office Rent',                        'expense', 'Administrative Expense'),
  ('6203', 'Office Utilities',                   'expense', 'Administrative Expense'),
  ('6204', 'Professional & Legal Fees',          'expense', 'Administrative Expense'),
  ('6205', 'Printing & Stationery',              'expense', 'Administrative Expense');

-- ---------- Finance Cost (period cost) ----------
insert into chart_of_accounts (code, name, type, subtype) values
  ('6301', 'Bank Charges & Interest',            'expense', 'Finance Cost');

-- ---------- tidy up subtypes for non-expense types too ----------
update chart_of_accounts set subtype = 'Fixed Asset'
  where name in ('Plant & Machinery', 'Furniture & Fittings', 'Motor Vehicles');
update chart_of_accounts set subtype = 'Other Revenue'
  where type = 'revenue' and name <> 'Sales Revenue';
