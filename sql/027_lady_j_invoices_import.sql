-- ============================================================
-- LADY J SCANNED INVOICES — DATA IMPORT
-- Generated from lib/data/lady-j-raw-invoices.json (200 invoices, 236 lines).
-- Safe to re-run: upserts on legacy_id, so running twice won't duplicate.
-- Run sql/026_lady_j_scan_columns.sql BEFORE this file.
-- ============================================================

do $$
declare
  v_invoice_id uuid;
begin
  -- Legacy invoice #201
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-11-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 201,
    'OK', 710700, 710700,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/201.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts', 1030, 690);

  -- Legacy invoice #202
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 202,
    'OK', 301780, 301780,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/202.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9584', 'Blooming Bay C/Neck Unisex', 382, 790);

  -- Legacy invoice #203
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-11-26'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 203,
    'OK', 165900, 165900,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/203.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9587', 'Blooming Bay C/Neck Unisex', 210, 790);

  -- Legacy invoice #204
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-11-26'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 204,
    'OK', 226060, 226060,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/204.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9595', 'Blooming Bay Mens', 254, 890);

  -- Legacy invoice #205
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-11-26'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 205,
    'OK', 216270, 216270,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/205.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Mens', 243, 890);

  -- Legacy invoice #206
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 206,
    'OK', 378000, 378000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/206.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Under Wear (Under Shorts)', 1080, 350);

  -- Legacy invoice #207
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 207,
    'OK', 645150, 645150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/207.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts', 935, 690);

  -- Legacy invoice #208
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 208,
    'OK', 574200, 574200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/208.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts Mens Big Size', 580, 990);

  -- Legacy invoice #209
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 209,
    'OK', 525780, 525780,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/209.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Short Rowan', 762, 690);

  -- Legacy invoice #210
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 210,
    'OK', 206480, 206480,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/210.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9509', 'C/Neck Blooming Bay Mens S/S T-Shirts', 232, 890);

  -- Legacy invoice #211
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 211,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/211.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '-', '-- Invoice not photographed/uploaded --', 0, 0);

  -- Legacy invoice #212
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 212,
    'OK', 74760, 74760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/212.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay Unisex', 84, 890);

  -- Legacy invoice #213
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 213,
    'OK', 126850, 126850,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/213.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9547', 'Blooming Bay C/Neck Ladies Strips', 215, 590);

  -- Legacy invoice #214
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 214,
    'OK', 123900, 123900,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/214.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9540', 'Blooming Bay C/Neck Strips', 210, 590);

  -- Legacy invoice #215
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 215,
    'OK', 126380, 126380,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/215.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9484', 'Blooming Bay C/Neck Ladies L/S', 142, 890);

  -- Legacy invoice #216
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 216,
    'OK', 180120, 180120,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/216.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9253', 'Blooming Bay C/Neck Ladies', 228, 790);

  -- Legacy invoice #217
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 217,
    'OK', 94800, 94800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/217.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9476', 'Blooming Bay Highneck Long Sleeve', 120, 790);

  -- Legacy invoice #218
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 218,
    'OK', 59000, 59000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/218.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9549', 'C/Neck Unisex', 100, 590);

  -- Legacy invoice #219
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 219,
    'OK', 215670, 215670,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/219.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9267', 'Blooming Bay Ladies', 273, 790);

  -- Legacy invoice #220
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 220,
    'OK', 194020, 194020,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/220.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9408', 'Blooming Bay Mens', 218, 890);

  -- Legacy invoice #221
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 221,
    'OK', 192360, 192360,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/221.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9460', 'Skinny Ladies', 78, 690);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9488', 'Blooming Bay Mens', 96, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9566', 'Blooming Bay Unisex Strip', 90, 590);

  -- Legacy invoice #222
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 222,
    'OK', 357080, 357080,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/222.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9432', 'Blooming Bay (Printed)', 452, 790);

  -- Legacy invoice #223
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 223,
    'MISMATCH', 418450, 418450,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/223.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9541', 'Blooming Bay C/Neck Unisex Strip', 100, 590);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9270', 'Blooming Bay Ladies', 278, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9305', 'Blooming Bay Ladies', 177, 790);

  -- Legacy invoice #224
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 224,
    'OK', 213300, 213300,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/224.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9264', 'Blooming Bay Ladies C/Neck', 270, 790);

  -- Legacy invoice #225
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 225,
    'OK', 309390, 309390,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/225.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9377', 'Blooming Bay Ladies C/Neck', 180, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9275', 'Blooming Bay Ladies', 117, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9394', 'Blooming Bay Long/Sleeve', 84, 890);

  -- Legacy invoice #226
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 226,
    'OK', 317080, 317080,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/226.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9498', 'Blooming Bay C/Neck Mens S/S T-Shirt', 132, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9409', 'Blooming Bay Ladies', 140, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9561', 'Blooming Bay Unisex', 100, 890);

  -- Legacy invoice #227
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 227,
    'MISMATCH', 589440, 589440,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/227.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9343', 'Blooming Bay Mens', 168, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9481', 'Blooming Bay Ladies Highneck Long Sleeve', 88, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9464', 'Blooming Bay Skinny Ladies', 88, 690);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 4, '9302', 'Blooming Bay Ladie Long Sleeve', 392, 790);

  -- Legacy invoice #228
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 228,
    'OK', 287750, 287750,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/228.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9473', 'Blooming Bay Ladies', 155, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9292', 'Blooming Bay Mens', 138, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9567', 'Blooming Bay Strip', 72, 590);

  -- Legacy invoice #229
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 229,
    'OK', 283510, 283510,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/229.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9443', 'Blooming Bay Mens', 169, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9481', 'Blooming Bay Hineck Ladies', 105, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9547', 'Blooming Bay Ladies Strip', 85, 590);

  -- Legacy invoice #230
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 230,
    'OK', 296800, 296800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/230.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9540', 'Blooming Bay Strip Ladies', 99, 590);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9493', 'Blooming Bay Ladies', 117, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9403', 'Blooming Bay Unisex', 164, 890);

  -- Legacy invoice #231
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 231,
    'OK', 379350, 379350,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/231.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9478', 'Blooming Bay Mens Skinny', 196, 690);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9273', 'Blooming Bay Ladies C/Neck', 171, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9486', 'Blooming Bay Ladies', 138, 790);

  -- Legacy invoice #232
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-05'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 232,
    'OK', 291000, 291000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/232.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9469', 'Blooming Bay Ladies Skinny', 92, 690);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9493', 'Blooming Bay C/Neck Ladies S/S', 288, 790);

  -- Legacy invoice #233
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-13'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 233,
    'N/A', 116100, 116100,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/233.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Designe 01', 90, 1290);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, 'N/A', 'Designe 02', 0, 0);

  -- Legacy invoice #234
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-13'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 234,
    'OK', 263160, 263160,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/234.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies frock Blooming Bay (D-1)', 102, 1290);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, 'N/A', 'Ladies frock (D-2)', 102, 1290);

  -- Legacy invoice #235
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 235,
    'OK', 331500, 331500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/235.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Shorts Unisex', 510, 650);

  -- Legacy invoice #236
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 236,
    'OK', 179310, 179310,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/236.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Spock Ladies', 139, 1290);

  -- Legacy invoice #237
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 237,
    'OK', 448560, 448560,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/237.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9679', 'Blooming Bay Mens', 504, 890);

  -- Legacy invoice #238
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 238,
    'OK', 317730, 317730,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/238.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9684', 'Blooming Bay Ladies Printed', 357, 890);

  -- Legacy invoice #239
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 239,
    'OK', 509970, 509970,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/239.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9689', 'Blooming Bay C/Neck Unisex', 573, 890);

  -- Legacy invoice #240
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 240,
    'OK', 106920, 106920,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/240.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9712', 'Blooming Bay Hineck', 108, 990);

  -- Legacy invoice #241
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 241,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/241.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '-', '-- Invoice not photographed/uploaded --', 0, 0);

  -- Legacy invoice #242
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 242,
    'OK', 415540, 415540,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/242.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9711', 'Blooming Bay C/Neck Ladies', 526, 790);

  -- Legacy invoice #243
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 243,
    'OK', 207690, 207690,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/243.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Frock', 161, 1290);

  -- Legacy invoice #244
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 244,
    'OK', 381150, 381150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/244.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Elephant Bells Pant', 363, 1050);

  -- Legacy invoice #245
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 245,
    'OK', 557140, 557140,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/245.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9858', 'Blooming Bay C/Neck Unisex', 626, 890);

  -- Legacy invoice #246
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 246,
    'OK', 123750, 123750,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/246.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9712', 'Blooming Bay C/Neck (Hineck)', 125, 990);

  -- Legacy invoice #247
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 247,
    'OK', 428970, 428970,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/247.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9711', 'Blooming Bay C/Neck Ladies', 543, 790);

  -- Legacy invoice #248
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 248,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/248.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '-', '-- Invoice not photographed/uploaded --', 0, 0);

  -- Legacy invoice #249
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 249,
    'OK', 357000, 357000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/249.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Elephant Bells Pants', 340, 1050);

  -- Legacy invoice #250
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 250,
    'OK', 219300, 219300,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/250.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Frock', 170, 1290);

  -- Legacy invoice #251
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 251,
    'OK', 378700, 378700,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/251.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Under Wear', 1082, 350);

  -- Legacy invoice #252
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 252,
    'OK', 502320, 502320,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/252.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Shorts Rowan', 728, 690);

  -- Legacy invoice #253
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 253,
    'OK', 224280, 224280,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/253.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9509', 'Blooming Bay Mens S/S T-Shirts', 252, 890);

  -- Legacy invoice #254
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 254,
    'OK', 58740, 58740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/254.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9304', 'Blooming Bay Unisex', 66, 890);

  -- Legacy invoice #255
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 255,
    'OK', 94800, 94800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/255.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9359', 'Blooming Bay Ladies', 120, 790);

  -- Legacy invoice #256
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 256,
    'OK', 116920, 116920,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/256.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9361', 'Blooming Bay C/Neck Ladies', 148, 790);

  -- Legacy invoice #257
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 257,
    'OK', 164650, 164650,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/257.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9366', 'Blooming Bay Mens', 185, 890);

  -- Legacy invoice #258
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 258,
    'OK', 210140, 210140,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/258.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9270', 'Blooming Bay Ladies', 203, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9485', 'Blooming Bay Hineck L/S Ladies', 63, 790);

  -- Legacy invoice #259
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 259,
    'OK', 213600, 213600,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/259.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9595', 'Blooming Bay Mens', 240, 890);

  -- Legacy invoice #260
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 260,
    'OK', 206980, 206980,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/260.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9264', 'Blooming Bay Ladies', 262, 790);

  -- Legacy invoice #261
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 261,
    'OK', 292810, 292810,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/261.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9584', 'Blooming Bay Unisex', 329, 890);

  -- Legacy invoice #262
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 262,
    'OK', 227800, 227800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/262.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9566', 'Blooming Bay Unisex Strip', 78, 590);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9587', 'Blooming Bay Unisex', 121, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9273', 'Blooming Bay Ladies', 43, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 4, '9567', 'Blooming Bay Ladies Strip', 68, 590);

  -- Legacy invoice #263
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 263,
    'OK', 155420, 155420,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/263.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9549', 'Blooming Bay Unisex Strip', 88, 590);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9460', 'Blooming Bay Skinny Ladies', 150, 690);

  -- Legacy invoice #264
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 264,
    'OK', 206060, 206060,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/264.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9597', 'Blooming Bay C/Neck Mens', 207, 890);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9397', 'Blooming Bay C/Neck Mens Strip', 37, 590);

  -- Legacy invoice #265
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 265,
    'OK', 200320, 200320,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/265.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9537', 'Rowan Active Skinny Ladies', 201, 390);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9484', 'Blooming Bay C/Neck Long Sleeve', 137, 890);

  -- Legacy invoice #266
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 266,
    'OK', 342950, 342950,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/266.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9460', 'Skinny Ladies Blooming Bay', 85, 690);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9385', 'Blooming Bay Ladies', 272, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 3, '9440', 'Blooming Bay Mens', 78, 890);

  -- Legacy invoice #267
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 267,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/267.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '-', '-- Invoice not photographed/uploaded --', 0, 0);

  -- Legacy invoice #268
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 268,
    'OK', 334050, 334050,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/268.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9540', 'Blooming Bay C/Neck Ladies Strip', 285, 590);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9476', 'Blooming Bay Long Sleeve High Neck', 210, 790);

  -- Legacy invoice #269
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 269,
    'OK', 190440, 190440,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/269.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9469', 'Blooming Bay Skinny', 276, 690);

  -- Legacy invoice #270
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 270,
    'OK', 244110, 244110,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/270.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9473', 'Blooming Bay Ladies C/Neck S/S', 309, 790);

  -- Legacy invoice #271
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2025-12-06'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 271,
    'OK', 130350, 130350,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/271.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9475', 'Blooming Bay Hineck Long Sleeve T-Shirts', 165, 790);

  -- Legacy invoice #272
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 272,
    'OK', 723600, 723600,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/272.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Mens Underwear', 1340, 540);

  -- Legacy invoice #273
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 273,
    'OK', 487760, 487760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/273.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Underwear Boys', 938, 520);

  -- Legacy invoice #274
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 274,
    'OK', 428980, 428980,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/274.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9679', 'Blooming Bay Mens', 482, 890);

  -- Legacy invoice #275
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 275,
    'OK', 311500, 311500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/275.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9684', 'Blooming Bay Ladies Printed', 350, 890);

  -- Legacy invoice #276
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 276,
    'OK', 509970, 509970,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/276.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9689', 'Blooming Bay C/Neck Unisex', 573, 890);

  -- Legacy invoice #277
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 277,
    'OK', 31680, 31680,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/277.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Big Size Shorts', 32, 990);

  -- Legacy invoice #278
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 278,
    'OK', 48300, 48300,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/278.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts', 70, 690);

  -- Legacy invoice #279
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 279,
    'OK', 203550, 203550,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/279.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9469', 'Blooming Bay Skinny', 295, 690);

  -- Legacy invoice #280
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 280,
    'OK', 129690, 129690,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/280.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9477', 'Blooming Bay C/Neck Mens', 131, 990);

  -- Legacy invoice #281
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 281,
    'OK', 97900, 97900,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/281.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9306', 'Blooming Bay Unisex', 110, 890);

  -- Legacy invoice #282
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 282,
    'OK', 161070, 161070,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/282.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9547', 'Blooming Bay C/Neck Strip', 273, 590);

  -- Legacy invoice #283
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 283,
    'OK', 43660, 43660,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/283.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9561', 'Blooming Bay C/Neck Unisex Strip', 74, 590);

  -- Legacy invoice #284
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 284,
    'OK', 161370, 161370,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/284.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9443', 'Blooming Bay Mens', 163, 990);

  -- Legacy invoice #285
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 285,
    'OK', 35400, 35400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/285.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9726', 'Blooming Bay C/Neck (Strap)', 60, 590);

  -- Legacy invoice #286
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 286,
    'OK', 54180, 54180,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/286.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'D04', 'Ladies Frock', 42, 1290);

  -- Legacy invoice #287
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 287,
    'OK', 35550, 35550,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/287.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Long Sleeve High Neck T-Shirts', 45, 790);

  -- Legacy invoice #288
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 288,
    'OK', 151110, 151110,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/288.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'High Neck S/S', 219, 690);

  -- Legacy invoice #289
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 289,
    'OK', 292810, 292810,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/289.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9725', 'Blooming Bay C/Neck Mens', 329, 890);

  -- Legacy invoice #290
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 290,
    'OK', 241740, 241740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/290.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9719', 'Blooming Bay Ladies Long Sleeve', 306, 790);

  -- Legacy invoice #291
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 291,
    'OK', 554400, 554400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/291.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9749', 'Blooming Bay Mens Polo Collar T-Shirts', 360, 1540);

  -- Legacy invoice #292
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 292,
    'OK', 139700, 139700,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/292.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Active Shorts', 635, 220);

  -- Legacy invoice #293
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 293,
    'OK', 241740, 241740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/293.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9719', 'Blooming Bay Ladies Long Sleeve', 306, 790);

  -- Legacy invoice #294
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 294,
    'OK', 296370, 296370,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/294.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9725', 'Blooming Bay Mens C/Neck', 333, 890);

  -- Legacy invoice #295
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 295,
    'OK', 37760, 37760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/295.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Mens (Strip)', 64, 590);

  -- Legacy invoice #296
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 296,
    'MISMATCH', 162840, 162840,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/296.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'High Neck Short Sleeve', 236, 690);

  -- Legacy invoice #297
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 297,
    'OK', 133100, 133100,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/297.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Active Shorts', 605, 220);

  -- Legacy invoice #298
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 298,
    'OK', 83740, 83740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/298.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'High Neck Long Sleeve T-Shirts', 106, 790);

  -- Legacy invoice #299
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-03'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 299,
    'OK', 603680, 603680,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/299.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9749', 'Blooming Bay Mens Polo Placket T-Shirts', 392, 1540);

  -- Legacy invoice #300
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-01-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 300,
    'OK', 200250, 200250,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/300.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Pant Ladies Bell', 31, 1050);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, 'N/A', 'Ladies Frock', 130, 1290);

  -- Legacy invoice #301
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 301,
    'OK', 418830, 418830,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/301.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts', 607, 690);

  -- Legacy invoice #302
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 302,
    'OK', 87000, 87000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/302.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'School Girls Underwears', 300, 290);

  -- Legacy invoice #303
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 303,
    'OK', 335710, 335710,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/303.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9731', 'Blooming Bay C/Neck Strip Mens', 569, 590);

  -- Legacy invoice #304
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 304,
    'OK', 187030, 187030,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/304.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9737', 'Blooming Bay C/Neck Stripe Ladies', 317, 590);

  -- Legacy invoice #305
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 305,
    'OK', 100570, 100570,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/305.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9767', 'Blooming Bay C/Neck Long Sleeve', 113, 890);

  -- Legacy invoice #306
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 306,
    'OK', 261900, 261900,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/306.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9757', 'Ladies Dress, Blooming Bay', 194, 1350);

  -- Legacy invoice #307
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 307,
    'OK', 349830, 349830,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/307.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts Mens', 507, 690);

  -- Legacy invoice #308
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 308,
    'OK', 93090, 93090,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/308.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'School Girls Underwear', 321, 290);

  -- Legacy invoice #309
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 309,
    'OK', 187620, 187620,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/309.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9829', 'Blooming Bay C/Neck Mens Strip', 318, 590);

  -- Legacy invoice #310
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 310,
    'OK', 353920, 353920,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/310.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Ladies Printed', 448, 790);

  -- Legacy invoice #311
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 311,
    'OK', 194950, 194950,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/311.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Ladies Under Shorts', 557, 350);

  -- Legacy invoice #312
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 312,
    'OK', 75840, 75840,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/312.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9834', 'Blooming Bay C/Neck Ladies Printed', 96, 790);

  -- Legacy invoice #313
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 313,
    'OK', 319800, 319800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/313.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Unisex Shorts', 492, 650);

  -- Legacy invoice #314
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 314,
    'OK', 272340, 272340,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/314.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9802', 'Blooming Bay C/Neck Mens', 306, 890);

  -- Legacy invoice #315
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 315,
    'OK', 71200, 71200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/315.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9758', 'Blooming Bay C/Neck Mens', 80, 890);

  -- Legacy invoice #316
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 316,
    'OK', 222750, 222750,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/316.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9757', 'Blooming Bay Ladies Dress', 165, 1350);

  -- Legacy invoice #317
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 317,
    'OK', 307310, 307310,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/317.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9784', 'Blooming Bay C/Neck Unisex', 389, 790);

  -- Legacy invoice #318
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 318,
    'OK', 109810, 109810,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/318.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Hi Neck', 139, 790);

  -- Legacy invoice #319
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 319,
    'OK', 173800, 173800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/319.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9799', 'Blooming Bay C/Neck Ladies Long S/V', 220, 790);

  -- Legacy invoice #320
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 320,
    'OK', 182850, 182850,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/320.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9795', 'Blooming Bay C/Neck Ladies', 265, 690);

  -- Legacy invoice #321
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 321,
    'OK', 175950, 175950,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/321.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9810', 'Blooming Bay C/Neck Ladies', 255, 690);

  -- Legacy invoice #322
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 322,
    'OK', 150890, 150890,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/322.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9813', 'Blooming Bay Unisex Printed', 191, 790);

  -- Legacy invoice #323
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 323,
    'OK', 248850, 248850,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/323.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9816', 'Blooming Bay C/Neck (Crop Top Printed)', 315, 790);

  -- Legacy invoice #324
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 324,
    'OK', 120000, 120000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/324.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9814', 'Blue Wolf C/Neck Kids Large Print', 150, 800);

  -- Legacy invoice #325
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 325,
    'OK', 326370, 326370,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/325.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Ladies', 473, 690);

  -- Legacy invoice #326
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 326,
    'OK', 237000, 237000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/326.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9821', 'Blooming Bay C/Neck Ladies Printed', 300, 790);

  -- Legacy invoice #327
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 327,
    'OK', 57960, 57960,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/327.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9798', 'Blooming Bay C/Neck (Crop Top)', 84, 690);

  -- Legacy invoice #328
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 328,
    'OK', 166690, 166690,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/328.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9800', 'Blooming Bay Hi Neck', 211, 790);

  -- Legacy invoice #329
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 329,
    'OK', 142400, 142400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/329.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9814', 'Blue Wolf C/Neck Kids Small Print', 178, 800);

  -- Legacy invoice #330
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-21'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 330,
    'OK', 110400, 110400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/330.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9833', 'Blue Wolf Small Print C/Neck', 138, 800);

  -- Legacy invoice #331
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 331,
    'OK', 370530, 370530,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/331.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9792', 'Blooming Bay C/Neck Ladies', 537, 690);

  -- Legacy invoice #332
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 332,
    'OK', 94010, 94010,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/332.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9840', 'Blooming Bay C/Neck Hi Neck Long Sleeve', 119, 790);

  -- Legacy invoice #333
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 333,
    'OK', 107440, 107440,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/333.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9767', 'Blooming Bay C/Neck Ladies (L/S)', 136, 790);

  -- Legacy invoice #334
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 334,
    'OK', 573540, 573540,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/334.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9856', 'Blooming Bay C/Neck Unisex Printed', 726, 790);

  -- Legacy invoice #335
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 335,
    'OK', 205400, 205400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/335.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9762', 'Blooming Bay C/Neck Ladies Long Sleeve', 260, 790);

  -- Legacy invoice #336
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 336,
    'OK', 302080, 302080,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/336.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9839', 'Blooming Bay C/Neck Ladies Strip', 512, 590);

  -- Legacy invoice #337
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 337,
    'OK', 250750, 250750,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/337.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9843', 'Blooming Bay C/Neck Mens Strip', 425, 590);

  -- Legacy invoice #338
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 338,
    'OK', 238580, 238580,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/338.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9847', 'Air Track C/Neck Ladies Sport (A/T)', 302, 790);

  -- Legacy invoice #339
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 339,
    'OK', 180670, 180670,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/339.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9848', 'C/Neck Blooming Bay Mens', 203, 890);

  -- Legacy invoice #340
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 340,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/340.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9810', 'Blooming Bay C/Neck Ladies -- CANCELLED --', 247, 0);

  -- Legacy invoice #341
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 341,
    'OK', 616150, 616150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/341.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Handloom Kurtha', 231, 1650);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, 'N/A', 'Linen Strip Dress / Shirt Dress', 100, 2350);

  -- Legacy invoice #342
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    current_date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 342,
    'OK', 297000, 297000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/342.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Mens Front Print (Special)', 300, 990);

  -- Legacy invoice #343
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 343,
    'OK', 337800, 337800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/343.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9868', 'Blue Woulf C/Neck Kids', 563, 600);

  -- Legacy invoice #344
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 344,
    'N/A', 0, 0,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/344.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Qulet (Elephant)', 388, 0);

  -- Legacy invoice #345
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 345,
    'OK', 325000, 325000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/345.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Unisex Shorts', 500, 650);

  -- Legacy invoice #346
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 346,
    'OK', 558920, 558920,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/346.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9858', 'Blooming Bay C/Neck Unisex', 628, 890);

  -- Legacy invoice #347
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 347,
    'OK', 153180, 153180,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/347.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9869', 'Blooming Bay C/Neck Ladies (S/S)', 222, 690);

  -- Legacy invoice #348
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 348,
    'OK', 216460, 216460,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/348.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9870', 'Blooming Bay C/Neck Ladies (L/S)', 274, 790);

  -- Legacy invoice #349
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 349,
    'OK', 297000, 297000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/349.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Men''s Front Print Special', 300, 990);

  -- Legacy invoice #350
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-04-08'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 350,
    'OK', 331200, 331200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/350.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9868', 'C/Neck - Kids Blue Woulf', 552, 600);

  -- Legacy invoice #351
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 351,
    'OK', 423660, 423660,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/351.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts Mens', 614, 690);

  -- Legacy invoice #352
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 352,
    'OK', 87000, 87000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/352.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'School Girls Underwear', 300, 290);

  -- Legacy invoice #353
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 353,
    'OK', 136500, 136500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/353.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Ladies Elephant Bell Pants', 130, 1050);

  -- Legacy invoice #354
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 354,
    'OK', 319190, 319190,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/354.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9731', 'Blooming Bay C/Neck Mens Stripe', 541, 590);

  -- Legacy invoice #355
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 355,
    'OK', 201190, 201190,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/355.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9737', 'Blooming Bay C/Neck Ladies Stripe', 341, 590);

  -- Legacy invoice #356
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 356,
    'OK', 101460, 101460,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/356.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9767', 'Blooming Bay C/Neck Long Sleeve', 114, 890);

  -- Legacy invoice #357
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-02-15'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 357,
    'OK', 263250, 263250,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/357.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9757', 'Ladies Dress, Blooming Bay', 195, 1350);

  -- Legacy invoice #358
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 358,
    'OK', 341550, 341550,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/358.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts', 495, 690);

  -- Legacy invoice #359
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 359,
    'OK', 80910, 80910,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/359.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'School Girls Underwear', 279, 290);

  -- Legacy invoice #360
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 360,
    'OK', 335340, 335340,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/360.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9809', 'Blooming Bay C/Neck Ladies', 486, 690);

  -- Legacy invoice #361
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 361,
    'OK', 226800, 226800,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/361.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay Ladies Dress', 168, 1350);

  -- Legacy invoice #362
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 362,
    'OK', 113760, 113760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/362.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9787', 'Blooming Bay C/Neck Hi Neck', 144, 790);

  -- Legacy invoice #363
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 363,
    'OK', 74760, 74760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/363.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9758', 'Blooming Bay C/Neck Mens', 84, 890);

  -- Legacy invoice #364
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 364,
    'OK', 112970, 112970,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/364.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9767', 'Blooming Bay C/Neck Ladies L/S', 143, 790);

  -- Legacy invoice #365
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 365,
    'OK', 164220, 164220,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/365.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts Sports', 238, 690);

  -- Legacy invoice #366
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 366,
    'OK', 282130, 282130,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/366.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9802', 'Blooming Bay C/Neck Mens', 317, 890);

  -- Legacy invoice #367
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 367,
    'OK', 61410, 61410,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/367.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9798', 'Blooming Bay C/Neck Crop Top', 89, 690);

  -- Legacy invoice #368
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 368,
    'OK', 255960, 255960,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/368.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9816', 'Blooming Bay C/Neck Crop Top Printed', 324, 790);

  -- Legacy invoice #369
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 369,
    'OK', 131200, 131200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/369.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9814', 'Blue Wolf C/Neck Kids Large Print', 164, 800);

  -- Legacy invoice #370
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 370,
    'OK', 145600, 145600,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/370.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9814', 'Blue Wolf C/Neck Small Print', 182, 800);

  -- Legacy invoice #371
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 371,
    'OK', 71100, 71100,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/371.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9834', 'Blooming Bay C/Neck Ladies Printed', 90, 790);

  -- Legacy invoice #372
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 372,
    'OK', 116000, 116000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/372.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9833', 'C/Neck Blue Wolf (Small Print)', 145, 800);

  -- Legacy invoice #373
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 373,
    'OK', 241740, 241740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/373.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9821', 'Blooming Bay C/Neck Ladies Printed', 306, 790);

  -- Legacy invoice #374
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 374,
    'OK', 311260, 311260,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/374.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blooming Bay C/Neck Unisex', 394, 790);

  -- Legacy invoice #375
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 375,
    'OK', 360240, 360240,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/375.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9825', 'Blooming Bay C/Neck Ladies Printed', 456, 790);

  -- Legacy invoice #376
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 376,
    'OK', 201780, 201780,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/376.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9829', 'Blooming Bay C/Neck Mens (Strip)', 342, 590);

  -- Legacy invoice #377
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 377,
    'OK', 616150, 616150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/377.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Handloom Kurtha', 231, 1650);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, 'N/A', 'Linen Strip Dress / Shirt Dress', 100, 2350);

  -- Legacy invoice #378
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 378,
    'OK', 170430, 170430,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/378.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9810', 'Blooming Bay C/Neck Ladies', 247, 690);

  -- Legacy invoice #379
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 379,
    'OK', 156420, 156420,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/379.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9813', 'Blooming Bay Unisex Printed', 198, 790);

  -- Legacy invoice #380
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 380,
    'OK', 157320, 157320,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/380.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9799', 'Blooming Bay C/Neck Ladies (L/S)', 228, 690);

  -- Legacy invoice #381
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 381,
    'OK', 182160, 182160,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/381.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9795', 'Blooming Bay C/Neck Ladies', 264, 690);

  -- Legacy invoice #382
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 382,
    'MISMATCH', 353920, 353920,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/382.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9800', 'Blooming Bay C/Neck Chi Neck (New Design)', 224, 790);
  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 2, '9800', 'Blooming Bay C/Neck Chi Neck (New Design)', 224, 790);

  -- Legacy invoice #383
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 383,
    'OK', 371220, 371220,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/383.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9792', 'Blooming Bay C/Neck Ladies', 538, 690);

  -- Legacy invoice #384
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 384,
    'OK', 113760, 113760,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/384.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9787', 'Blooming Bay C/Neck Hi Neck', 144, 790);

  -- Legacy invoice #385
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 385,
    'OK', 104280, 104280,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/385.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9840', 'Blooming Bay C/Neck Long Sleeve (Hi Neck)', 132, 790);

  -- Legacy invoice #386
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 386,
    'OK', 257830, 257830,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/386.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9843', 'Blooming Bay C/Neck Mens Strip', 437, 590);

  -- Legacy invoice #387
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 387,
    'OK', 308570, 308570,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/387.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9839', 'Blooming Bay C/Neck Ladies Stripe', 523, 590);

  -- Legacy invoice #388
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 388,
    'OK', 583810, 583810,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/388.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9856', 'Blooming Bay C/Neck Unisex Printed', 739, 790);

  -- Legacy invoice #389
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 389,
    'OK', 241740, 241740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/389.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9847', 'Air Track C/Neck Ladies Sport', 306, 790);

  -- Legacy invoice #390
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-28'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 390,
    'OK', 186900, 186900,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/390.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9848', 'C/Neck Blooming Bay Mens', 210, 890);

  -- Legacy invoice #391
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 391,
    'OK', 2050000, 2050000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/391.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Mens Shorts', 1640, 1250);

  -- Legacy invoice #392
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 392,
    'OK', 297000, 297000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/392.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Mens C/Neck Front (Print)', 300, 990);

  -- Legacy invoice #393
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 393,
    'OK', 475200, 475200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/393.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts Men''s (Big Size)', 480, 990);

  -- Legacy invoice #394
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 394,
    'OK', 528510, 528510,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/394.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9858', 'Blooming Bay Unisex Printed', 669, 790);

  -- Legacy invoice #395
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 395,
    'OK', 316140, 316140,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/395.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'T-Shirts (Kids)', 1437, 220);

  -- Legacy invoice #396
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 396,
    'OK', 82500, 82500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/396.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Active Shorts', 375, 220);

  -- Legacy invoice #397
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-03-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 397,
    'OK', 462990, 462990,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/397.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts Mens', 671, 690);

  -- Legacy invoice #398
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-08-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 398,
    'OK', 584730, 584730,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/398.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9865', 'Blooming Bay C/Neck Unisex', 657, 890);

  -- Legacy invoice #399
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-08-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 399,
    'OK', 157320, 157320,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/399.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9869', 'Blooming Bay C/Neck Ladies (S/S)', 228, 690);

  -- Legacy invoice #400
  insert into invoices (
    invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    '2026-08-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 400,
    'OK', 222780, 222780,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/400.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9870', 'Blooming Bay C/Neck Ladies (S/S)', 282, 790);

end $$;