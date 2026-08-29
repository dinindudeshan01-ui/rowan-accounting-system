import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Server-side endpoint backing /accounting/lady-j-invoices/upload.
// Runs with the Supabase service role key (never sent to the browser) so it
// can write to the `lady-j-invoices` Storage bucket, which has no anon/
// authenticated insert policy (see sql/026_lady_j_scan_columns.sql).
//
// Gated by a shared secret the uploader types into the page once per
// session. Set LADY_J_UPLOAD_SECRET in Vercel — falls back to the old
// one-off ADMIN_SECRET only for backwards compatibility; set the new env
// var and stop relying on the fallback.
const FALLBACK_SECRET = '5fMVe37FQtjpa8Yj9wAKxO3TL6qtII4-';
const BUCKET = 'lady-j-invoices';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}

export async function GET(req: NextRequest) {
  // Used by the upload page on load to suggest the next free invoice number.
  const secret = req.nextUrl.searchParams.get('secret');
  const expected = process.env.LADY_J_UPLOAD_SECRET || FALLBACK_SECRET;
  if (secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server missing Supabase env vars' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('invoices')
    .select('legacy_id')
    .eq('source', 'lady_j_scan')
    .order('legacy_id', { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextId = (data?.[0]?.legacy_id ?? 0) + 1;
  return NextResponse.json({ nextId });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const secret = form.get('secret');
  const expected = process.env.LADY_J_UPLOAD_SECRET || FALLBACK_SECRET;
  if (secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server missing Supabase env vars' }, { status: 500 });
  }

  const legacyId = Number(form.get('legacyId'));
  const date = (form.get('date') as string) || null;
  const code = (form.get('code') as string) || 'N/A';
  const customer = (form.get('customer') as string) || 'Lady J, Maharagama';
  const item = (form.get('item') as string) || '';
  const qty = Number(form.get('qty') || 0);
  const price = Number(form.get('price') || 0);
  const total = Number(form.get('total') || qty * price);
  const matchStatus = (form.get('matchStatus') as string) || 'OK';
  const cancelled = form.get('cancelled') === 'true';
  const file = form.get('image') as File | null;

  if (!legacyId || legacyId < 1) {
    return NextResponse.json({ error: 'legacyId is required' }, { status: 400 });
  }
  if (!item) {
    return NextResponse.json({ error: 'item description is required' }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${legacyId}.webp`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || 'image/webp',
      upsert: true,
    });
    if (upErr) {
      return NextResponse.json({ error: `Image upload failed: ${upErr.message}` }, { status: 500 });
    }
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  const { data: invoiceRow, error: invErr } = await admin
    .from('invoices')
    .upsert(
      {
        invoice_number: `LJ-${legacyId}`,
        invoice_date: date,
        purchaser_name: customer,
        currency: 'LKR',
        status: cancelled ? 'void' : 'issued',
        source: 'lady_j_scan',
        legacy_id: legacyId,
        match_status: cancelled ? 'N/A' : matchStatus,
        subtotal: cancelled ? 0 : total,
        total_amount: cancelled ? 0 : total,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      },
      { onConflict: 'legacy_id' }
    )
    .select('id')
    .single();

  if (invErr || !invoiceRow) {
    return NextResponse.json({ error: invErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  await admin.from('invoice_lines').delete().eq('invoice_id', invoiceRow.id);

  if (!cancelled) {
    const { error: lineErr } = await admin.from('invoice_lines').insert({
      invoice_id: invoiceRow.id,
      line_no: 1,
      code,
      description: item,
      qty,
      unit_price: price,
    });
    if (lineErr) {
      return NextResponse.json({ error: `Line insert failed: ${lineErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, legacyId, invoiceId: invoiceRow.id, imageUrl });
}
