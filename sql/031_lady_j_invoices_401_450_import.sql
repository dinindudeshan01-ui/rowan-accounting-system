-- ============================================================
-- LADY J SCANNED INVOICES — BATCH 2 IMPORT (#401-450)
-- Generated from lib/data/lady-j-raw-invoices.json (50 invoices, continuing
-- from the first batch of 200 in sql/027). Same shape as 027 + 029 combined:
-- invoice_number is set directly to LJ-<id> here (no separate 029-style fix
-- needed). Safe to re-run: upserts on legacy_id.
-- Run sql/026_lady_j_scan_columns.sql first if not already applied.
-- #416 was cancelled on the original paper invoice (crossed out, no total) —
-- imported with status='void' and zero amounts so the numbering stays intact.
-- #415 has a genuine qty*price math error on the original paper invoice
-- (100 x 29.50 should total 2,950 but the invoice was written up as 29,500) —
-- imported as-is with match_status='MISMATCH' so it surfaces for review rather
-- than being silently corrected.
-- ============================================================

do $$
declare
  v_invoice_id uuid;
begin
  -- Legacy invoice #401
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-401', '2026-04-25'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 401,
    'OK', 237600, 237600,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/401.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts (Big Size)', 240, 990);

  -- Legacy invoice #402
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-402', '2026-04-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 402,
    'OK', 300240, 300240,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/402.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Underwears (Mens)', 556, 540);

  -- Legacy invoice #403
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-403', '2026-04-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 403,
    'OK', 231400, 231400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/403.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Underwears', 445, 520);

  -- Legacy invoice #404
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-404', '2026-04-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 404,
    'OK', 175330, 175330,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/404.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9877', 'Blooming Bay C/Neck Mens', 197, 890);

  -- Legacy invoice #405
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-405', '2026-04-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 405,
    'OK', 169100, 169100,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/405.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9886', 'Blooming Bay C/Neck Mens', 190, 890);

  -- Legacy invoice #406
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-406', '2026-04-24'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 406,
    'OK', 382200, 382200,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/406.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9885', 'C/Neck Kids Printed (S/S)', 637, 600);

  -- Legacy invoice #407
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-407', '2026-04-24'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 407,
    'OK', 167320, 167320,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/407.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9866', 'Blooming Bay C/Neck Mens White (S/S)', 188, 890);

  -- Legacy invoice #408
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-408', '2026-04-25'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 408,
    'OK', 372600, 372600,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/408.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Blue Wolf Check Kids Printed (S/S)', 621, 600);

  -- Legacy invoice #409
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-409', '2026-04-25'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 409,
    'OK', 520740, 520740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/409.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts (Big Size)', 526, 990);

  -- Legacy invoice #410
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-410', '2026-04-25'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 410,
    'OK', 334260, 334260,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/410.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Underwear (Mens)', 619, 540);

  -- Legacy invoice #411
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-411', '2026-04-25'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 411,
    'OK', 143520, 143520,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/411.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Underwear (Boys)', 276, 520);

  -- Legacy invoice #412
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-412', '2026-04-25'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 412,
    'OK', 174440, 174440,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/412.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9877', 'Blooming Bay C/Neck Mens', 196, 890);

  -- Legacy invoice #413
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-413', '2026-04-24'::date, 'Andre Life Style Clothing (Pvt) Ltd', 'LKR', 'issued', 'lady_j_scan', 413,
    'OK', 210000, 210000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/413.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Body Cord with Colour Beads', 5600, 37.5);

  -- Legacy invoice #414
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-414', '2026-04-24'::date, 'Andre Life Style Clothing (Pvt) Ltd', 'LKR', 'issued', 'lady_j_scan', 414,
    'OK', 187500, 187500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/414.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Body Cord with Collar Beads', 5000, 37.5);

  -- Legacy invoice #415
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-415', '2026-04-24'::date, 'Andre Life Style Clothing (Pvt) Ltd', 'LKR', 'issued', 'lady_j_scan', 415,
    'MISMATCH', 29500, 29500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/415.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Box Board', 100, 29.5);

  -- Legacy invoice #416
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-416', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'void', 'lady_j_scan', 416,
    'N/A', 0, 0,
    null
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Men''s Shorts (CANCELLED)', 1494, 690);

  -- Legacy invoice #417
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-417', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 417,
    'OK', 690000, 690000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/417.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts (Mens)', 1000, 690);

  -- Legacy invoice #418
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-418', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 418,
    'OK', 340860, 340860,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/418.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Shorts (Mens)', 494, 690);

  -- Legacy invoice #419
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-419', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 419,
    'OK', 119370, 119370,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/419.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9926', 'Blooming Bay C/Neck Ladies Strip (S/S)', 173, 690);

  -- Legacy invoice #420
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-420', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 420,
    'OK', 107440, 107440,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/420.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9915', 'Blooming Bay Hi Neck (L/S)', 136, 790);

  -- Legacy invoice #421
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-421', '2026-06-04'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 421,
    'OK', 224940, 224940,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/421.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9914', 'Blooming Bay C/Neck Ladies Strip', 326, 690);

  -- Legacy invoice #422
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-422', '2026-06-09'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 422,
    'OK', 296700, 296700,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/422.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9920', 'Blooming Bay Crop Top (S/S) Printed', 430, 690);

  -- Legacy invoice #423
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-423', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 423,
    'OK', 127980, 127980,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/423.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9960', 'Blooming Bay Hi Neck T-Shirt (4S)', 162, 790);

  -- Legacy invoice #424
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-424', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 424,
    'OK', 233050, 233050,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/424.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9940', 'C-Neck Ladies Printed', 295, 790);

  -- Legacy invoice #425
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-425', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 425,
    'OK', 255000, 255000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/425.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '3290', 'C-Neck Mens Printed (Mix Print)', 300, 850);

  -- Legacy invoice #426
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-426', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 426,
    'OK', 230680, 230680,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/426.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9953', 'Blooming Bay C/Neck Ladies Printed', 292, 790);

  -- Legacy invoice #427
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-427', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 427,
    'OK', 117740, 117740,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/427.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Girls School Underwear', 406, 290);

  -- Legacy invoice #428
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-428', '2026-06-17'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 428,
    'OK', 324300, 324300,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/428.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9931', 'Blooming Bay C/Neck Ladies', 470, 690);

  -- Legacy invoice #429
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-429', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 429,
    'OK', 387150, 387150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/429.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9924', 'Blooming Bay C-Neck Mens (S/S)', 435, 890);

  -- Legacy invoice #430
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-430', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 430,
    'OK', 276000, 276000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/430.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9920', 'Blooming Bay Crop Top Printed (S/S)', 400, 690);

  -- Legacy invoice #431
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-431', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 431,
    'OK', 224940, 224940,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/431.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9905', 'Blooming Bay C/Neck (Crop Top)', 326, 690);

  -- Legacy invoice #432
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-432', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 432,
    'OK', 108560, 108560,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/432.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9906', 'Blooming Bay C/Neck Mens Stripes (S/S)', 184, 590);

  -- Legacy invoice #433
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-433', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 433,
    'OK', 231150, 231150,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/433.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9914', 'Blooming Bay C-Neck Ladies Strip (S/S)', 335, 690);

  -- Legacy invoice #434
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-434', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 434,
    'OK', 94010, 94010,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/434.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9915', 'Blooming Bay Hi Neck (L/S)', 119, 790);

  -- Legacy invoice #435
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-435', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 435,
    'OK', 81420, 81420,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/435.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9926', 'Blooming Bay C/Neck Ladies', 118, 690);

  -- Legacy invoice #436
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-436', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 436,
    'OK', 124030, 124030,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/436.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9960', 'Blooming Bay Hi Neck C/Ls Printed', 157, 790);

  -- Legacy invoice #437
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-437', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 437,
    'OK', 313260, 313260,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/437.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9931', 'Blooming Bay Ladies C/Neck', 454, 690);

  -- Legacy invoice #438
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-438', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 438,
    'OK', 211720, 211720,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/438.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9940', 'Blooming Bay C/Neck Ladies Printed', 268, 790);

  -- Legacy invoice #439
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-439', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 439,
    'OK', 217250, 217250,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/439.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9953', 'Blooming Bay C/Neck Ladies Printed', 275, 790);

  -- Legacy invoice #440
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-440', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 440,
    'OK', 260700, 260700,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/440.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9956', 'Blooming Bay C-Neck Unisex Printed', 330, 790);

  -- Legacy invoice #441
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-441', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 441,
    'OK', 500000, 500000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/441.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'T-Shirt Mix Print', 1000, 500);

  -- Legacy invoice #442
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-442', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 442,
    'OK', 116870, 116870,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/442.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Girls School Underwear', 403, 290);

  -- Legacy invoice #443
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-443', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 443,
    'OK', 292300, 292300,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/443.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9910', 'C-Neck Ladies Air Track Sports', 370, 790);

  -- Legacy invoice #444
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-444', '2026-06-17'::date, 'Lady J, Borella', 'LKR', 'issued', 'lady_j_scan', 444,
    'OK', 193550, 193550,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/444.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9989', 'Blooming Bay Hi Neck', 245, 790);

  -- Legacy invoice #445
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-445', '2026-06-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 445,
    'OK', 650000, 650000,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/445.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Unisex Shorts', 1000, 650);

  -- Legacy invoice #446
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-446', '2026-06-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 446,
    'OK', 133500, 133500,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/446.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9969', 'Mens Strip (Blooming Bay)', 150, 890);

  -- Legacy invoice #447
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-447', '2026-06-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 447,
    'OK', 234630, 234630,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/447.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9966', 'Blooming Bay C/Neck Ladies Printed', 297, 790);

  -- Legacy invoice #448
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-448', '2026-06-20'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 448,
    'OK', 397370, 397370,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/448.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '9970', 'Blooming Bay C/Neck Ladies Printed', 503, 790);

  -- Legacy invoice #449
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-449', '2026-06-27'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 449,
    'OK', 547400, 547400,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/449.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, '001', 'T-Shirt', 644, 850);

  -- Legacy invoice #450
  insert into invoices (
    invoice_number, invoice_date, purchaser_name, currency, status, source, legacy_id,
    match_status, subtotal, total_amount, image_url
  ) values (
    'LJ-450', '2026-06-27'::date, 'Lady J, Maharagama', 'LKR', 'issued', 'lady_j_scan', 450,
    'OK', 63360, 63360,
    'https://SUPABASE_PROJECT.supabase.co/storage/v1/object/public/lady-j-invoices/450.webp'
  )
  on conflict (legacy_id) where legacy_id is not null do update set
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    purchaser_name = excluded.purchaser_name,
    status = excluded.status,
    match_status = excluded.match_status,
    subtotal = excluded.subtotal,
    total_amount = excluded.total_amount,
    image_url = excluded.image_url
  returning id into v_invoice_id;

  delete from invoice_lines where invoice_id = v_invoice_id;

  insert into invoice_lines (invoice_id, line_no, code, description, qty, unit_price)
  values (v_invoice_id, 1, 'N/A', 'Rowan Mens Shorts (Big Size)', 64, 990);

end $$;