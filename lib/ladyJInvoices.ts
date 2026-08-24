import { supabase } from './supabase';

export type LadyJLineItem = {
  id: number | string;
  date: string | null;
  code: string;
  customer: string;
  item: string;
  qty: number;
  price: number;
  total: number;
  status: 'OK' | 'MISMATCH' | 'N/A' | string;
};

export type LadyJInvoice = {
  id: number; // legacy_id, kept for display ("Invoice #201") and search
  uuid: string; // real invoices.id, needed for links to /accounting/invoice/[id]/print etc.
  date: string | null;
  customer: string;
  lines: LadyJLineItem[];
  total: number;
  status: 'OK' | 'MISMATCH' | 'N/A';
  imageUrl: string | null;
};

/**
 * Lady J scanned invoices now live in the same `invoices` / `invoice_lines`
 * tables as regular invoices, tagged with source = 'lady_j_scan' and a
 * legacy_id carried over from the original scanned-invoice spreadsheet.
 * See sql/026_lady_j_scan_columns.sql and sql/027_lady_j_invoices_import.sql.
 */
export async function getLadyJInvoices(): Promise<LadyJInvoice[]> {
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('id, legacy_id, invoice_date, purchaser_name, total_amount, match_status, image_url')
    .eq('source', 'lady_j_scan')
    .order('legacy_id', { ascending: true });

  if (invErr || !invoices) {
    console.error('Failed to load Lady J invoices:', invErr?.message);
    return [];
  }

  const ids = invoices.map((i) => i.id);
  const { data: lines, error: lineErr } = await supabase
    .from('invoice_lines')
    .select('invoice_id, line_no, code, description, qty, unit_price')
    .in('invoice_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    .order('line_no', { ascending: true });

  if (lineErr) {
    console.error('Failed to load Lady J invoice lines:', lineErr.message);
  }

  const linesByInvoice = new Map<string, LadyJLineItem[]>();
  for (const l of lines ?? []) {
    const arr = linesByInvoice.get(l.invoice_id) ?? [];
    arr.push({
      id: l.line_no,
      date: null,
      code: l.code ?? 'N/A',
      customer: '',
      item: l.description,
      qty: Number(l.qty) || 0,
      price: Number(l.unit_price) || 0,
      total: (Number(l.qty) || 0) * (Number(l.unit_price) || 0),
      status: '',
    });
    linesByInvoice.set(l.invoice_id, arr);
  }

  return invoices.map((inv) => ({
    id: inv.legacy_id ?? 0,
    uuid: inv.id,
    date: inv.invoice_date,
    customer: inv.purchaser_name,
    lines: linesByInvoice.get(inv.id) ?? [],
    total: Number(inv.total_amount) || 0,
    status: (inv.match_status as LadyJInvoice['status']) ?? 'N/A',
    imageUrl: inv.image_url ?? null,
  }));
}

export async function getLadyJInvoiceById(legacyId: number): Promise<LadyJInvoice | undefined> {
  const all = await getLadyJInvoices();
  return all.find((inv) => inv.id === legacyId);
}
