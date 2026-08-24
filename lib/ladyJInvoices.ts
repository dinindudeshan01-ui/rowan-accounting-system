import rawInvoices from './data/lady-j-raw-invoices.json';
import attachments from './data/lady-j-attachments.json';

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
  id: number;
  date: string | null;
  customer: string;
  lines: LadyJLineItem[];
  total: number;
  status: 'OK' | 'MISMATCH' | 'N/A';
  imageUrl: string | null;
};

const attachmentMap = attachments as Record<string, string>;

function isLegendRow(row: any): boolean {
  return typeof row.id !== 'number';
}

/** Group the flat RAW_INVOICES rows (one row per line item) into one record per invoice id. */
export function getLadyJInvoices(): LadyJInvoice[] {
  const byId = new Map<number, LadyJLineItem[]>();

  for (const row of rawInvoices as any[]) {
    if (isLegendRow(row)) continue;
    const id = row.id as number;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id)!.push(row as LadyJLineItem);
  }

  const invoices: LadyJInvoice[] = [];
  for (const [id, lines] of byId.entries()) {
    const total = lines.reduce((sum, l) => sum + (l.total || 0), 0);
    const hasMismatch = lines.some((l) => l.status === 'MISMATCH');
    const hasNA = lines.every((l) => l.status === 'N/A');
    const status: LadyJInvoice['status'] = hasMismatch ? 'MISMATCH' : hasNA ? 'N/A' : 'OK';
    const imgPath = attachmentMap[String(id)];
    invoices.push({
      id,
      date: lines[0]?.date ?? null,
      customer: lines[0]?.customer ?? 'Unknown',
      lines,
      total,
      status,
      imageUrl: imgPath ? `/${imgPath}` : null,
    });
  }

  invoices.sort((a, b) => a.id - b.id);
  return invoices;
}

export function getLadyJInvoiceById(id: number): LadyJInvoice | undefined {
  return getLadyJInvoices().find((inv) => inv.id === id);
}
