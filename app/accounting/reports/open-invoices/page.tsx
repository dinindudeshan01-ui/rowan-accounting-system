'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import {
  Chip,
  DataTable,
  ReportFrame,
  StatRow,
  ToggleGroup,
  Field,
  fmt,
  fmtDate,
  money,
  tableCsv,
  todayISO,
  type Col,
} from '@/components/ReportKit';

type Inv = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  purchaser_name: string;
  customer_id: string | null;
  total_amount: number;
  amount_paid: number;
};

type Row = Inv & { due: string; open: number; daysOverdue: number };
type CustRow = { name: string; count: number; billed: number; paid: number; open: number; overdue: number; oldest: string };

export default function OpenInvoicesReport() {
  const today = todayISO();
  const [rows, setRows] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('detail');
  const [search, setSearch] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAll<Inv>((from, to) =>
      supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, due_date, purchaser_name, customer_id, total_amount, amount_paid')
        .eq('status', 'issued')
        .order('invoice_date')
        .order('id')
        .range(from, to)
    )
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const data: Row[] = useMemo(() => {
    const t = new Date(today + 'T00:00:00').getTime();
    const q = search.trim().toLowerCase();
    return rows
      .map((r) => {
        const due = r.due_date ?? r.invoice_date;
        const open = Number(r.total_amount) - Number(r.amount_paid);
        const daysOverdue = Math.round((t - new Date(due + 'T00:00:00').getTime()) / 86400000);
        return { ...r, due, open, daysOverdue };
      })
      .filter((r) => r.open > 0.01)
      .filter((r) => !overdueOnly || r.daysOverdue > 0)
      .filter((r) => !q || r.purchaser_name.toLowerCase().includes(q) || r.invoice_number.toLowerCase().includes(q))
      .sort((a, b) => a.purchaser_name.localeCompare(b.purchaser_name) || a.invoice_date.localeCompare(b.invoice_date));
  }, [rows, today, search, overdueOnly]);

  const byCustomer: CustRow[] = useMemo(() => {
    const m = new Map<string, CustRow>();
    for (const r of data) {
      const k = r.customer_id ?? r.purchaser_name;
      const e = m.get(k) ?? { name: r.purchaser_name, count: 0, billed: 0, paid: 0, open: 0, overdue: 0, oldest: r.due };
      e.count += 1;
      e.billed += Number(r.total_amount);
      e.paid += Number(r.amount_paid);
      e.open += r.open;
      if (r.daysOverdue > 0) e.overdue += r.open;
      if (r.due < e.oldest) e.oldest = r.due;
      m.set(k, e);
    }
    return Array.from(m.values()).sort((a, b) => b.open - a.open);
  }, [data]);

  const total = data.reduce((s, r) => s + r.open, 0);
  const overdue = data.filter((r) => r.daysOverdue > 0).reduce((s, r) => s + r.open, 0);

  const detailCols: Col<Row>[] = [
    { label: 'Customer', value: (r) => r.purchaser_name },
    { label: 'Invoice #', value: (r) => r.invoice_number },
    { label: 'Date', value: (r) => r.invoice_date, format: (r) => fmtDate(r.invoice_date) },
    { label: 'Due', value: (r) => r.due, format: (r) => fmtDate(r.due) },
    {
      label: 'Status',
      align: 'center',
      value: (r) => (r.daysOverdue > 0 ? `${r.daysOverdue} days overdue` : 'Not yet due'),
      format: (r) => (r.daysOverdue > 0 ? <Chip tone="red">{r.daysOverdue}d overdue</Chip> : <Chip tone="green">Not due</Chip>),
    },
    money<Row>('Invoiced', (r) => Number(r.total_amount)),
    money<Row>('Paid', (r) => Number(r.amount_paid)),
    money<Row>('Open balance', (r) => r.open, { format: (r) => <b>{fmt(r.open)}</b> }),
  ];

  const summaryCols: Col<CustRow>[] = [
    { label: 'Customer', value: (r) => r.name },
    { label: 'Open invoices', align: 'right', value: (r) => r.count, sum: true, totalFormat: (n) => n },
    { label: 'Oldest due', value: (r) => r.oldest, format: (r) => fmtDate(r.oldest) },
    money<CustRow>('Invoiced', (r) => r.billed),
    money<CustRow>('Paid', (r) => r.paid),
    money<CustRow>('Overdue', (r) => r.overdue),
    money<CustRow>('Open balance', (r) => r.open, { format: (r) => <b>{fmt(r.open)}</b> }),
  ];

  const hasPayments = rows.some((r) => Number(r.amount_paid) > 0);

  return (
    <ReportFrame
      title="Open Invoices"
      periodText={`Unpaid invoices as of ${fmtDate(today)}`}
      loading={loading}
      error={error}
      maxWidth="max-w-6xl"
      controls={
        <>
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { value: 'detail', label: 'Detail' },
              { value: 'summary', label: 'By customer' },
            ]}
          />
          <Field label="Customer / invoice">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-44"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
        </>
      }
      getCsv={() =>
        view === 'detail'
          ? { filename: `open-invoices-${today}.csv`, rows: tableCsv(detailCols, data) }
          : { filename: `open-invoices-by-customer-${today}.csv`, rows: tableCsv(summaryCols, byCustomer) }
      }
      notes={
        <>
          <p>Balances are as of today (invoice total less payments applied); an invoice with no due date is treated as due on its invoice date.</p>
          {!hasPayments && rows.length > 0 && (
            <p className="text-amber-700">
              No payments are applied to any invoice yet, so every open balance equals the full invoice amount. Record receipts in Receive Payment to
              reduce them.
            </p>
          )}
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Open invoices', value: data.length },
          { label: 'Customers', value: byCustomer.length },
          { label: 'Total open', value: fmt(total) },
          { label: 'Overdue', value: fmt(overdue), tone: overdue > 0 ? 'red' : 'green' },
        ]}
      />
      {view === 'detail' ? (
        <DataTable cols={detailCols} rows={data} rowKey={(r) => r.id} empty="No open invoices" />
      ) : (
        <DataTable cols={summaryCols} rows={byCustomer} rowKey={(r) => r.name} empty="No open invoices" />
      )}
    </ReportFrame>
  );
}
