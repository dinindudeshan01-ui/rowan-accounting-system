'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  StatRow,
  ToggleGroup,
  fmt,
  fmtDate,
  money,
  one,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type ExpenseRow = {
  id: string;
  expense_number: string;
  expense_date: string;
  payment_type: 'paid_now' | 'bill';
  payment_method: string | null;
  reference: string | null;
  memo: string | null;
  total_amount: number;
  amount_paid: number;
  vendor_id: string;
  vendors: { display_name: string } | { display_name: string }[] | null;
  expense_lines: {
    line_no: number;
    description: string | null;
    amount: number;
    chart_of_accounts: { code: string; name: string } | { code: string; name: string }[] | null;
  }[];
};

type LineRow = {
  key: string;
  vendor: string;
  date: string;
  number: string;
  type: 'paid_now' | 'bill';
  account: string;
  description: string;
  amount: number;
};

type VendorRow = { vendor: string; count: number; total: number; paid: number; open: number };

export default function ExpensesByVendorReport() {
  const p = usePeriod('year');
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'paid_now' | 'bill'>('all');

  useEffect(() => {
    setLoading(true);
    fetchAll<ExpenseRow>((from, to) =>
      supabase
        .from('expenses')
        .select(
          'id, expense_number, expense_date, payment_type, payment_method, reference, memo, total_amount, amount_paid, vendor_id, vendors(display_name), expense_lines(line_no, description, amount, chart_of_accounts(code, name))'
        )
        .eq('status', 'posted')
        .gte('expense_date', p.start)
        .lte('expense_date', p.end)
        .order('expense_date')
        .order('id')
        .range(from, to)
    )
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => {
        setRows([]);
        setError(e?.message ?? 'Failed to load expenses');
      })
      .finally(() => setLoading(false));
  }, [p.start, p.end]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const v = one(r.vendors)?.display_name ?? '';
      return (type === 'all' || r.payment_type === type) && (!q || v.toLowerCase().includes(q) || r.expense_number.toLowerCase().includes(q));
    });
  }, [rows, search, type]);

  const paidOf = (r: ExpenseRow) => (r.payment_type === 'paid_now' ? Number(r.total_amount) : Number(r.amount_paid));

  const vendors: VendorRow[] = useMemo(() => {
    const m = new Map<string, VendorRow>();
    for (const r of filtered) {
      const name = one(r.vendors)?.display_name ?? 'Unknown vendor';
      const e = m.get(r.vendor_id) ?? { vendor: name, count: 0, total: 0, paid: 0, open: 0 };
      e.count += 1;
      e.total += Number(r.total_amount);
      e.paid += paidOf(r);
      e.open += Number(r.total_amount) - paidOf(r);
      m.set(r.vendor_id, e);
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const lines: LineRow[] = useMemo(
    () =>
      filtered
        .flatMap((r) => {
          const vendor = one(r.vendors)?.display_name ?? 'Unknown vendor';
          return [...r.expense_lines]
            .sort((a, b) => a.line_no - b.line_no)
            .map((l) => {
              const acc = one(l.chart_of_accounts);
              return {
                key: `${r.id}-${l.line_no}`,
                vendor,
                date: r.expense_date,
                number: r.expense_number,
                type: r.payment_type,
                account: acc ? `${acc.code} ${acc.name}` : '—',
                description: l.description ?? r.memo ?? '',
                amount: Number(l.amount),
              };
            });
        })
        .sort((a, b) => a.vendor.localeCompare(b.vendor) || a.date.localeCompare(b.date)),
    [filtered]
  );

  const total = vendors.reduce((s, v) => s + v.total, 0);
  const open = vendors.reduce((s, v) => s + v.open, 0);

  const typeChip = (t: 'paid_now' | 'bill') => (t === 'bill' ? <Chip tone="amber">Bill</Chip> : <Chip tone="green">Paid</Chip>);

  const summaryCols: Col<VendorRow>[] = [
    { label: 'Vendor', value: (r) => r.vendor },
    { label: 'Expenses', align: 'right', value: (r) => r.count, sum: true, totalFormat: (n) => n },
    money<VendorRow>('Total', (r) => r.total, { format: (r) => <b>{fmt(r.total)}</b> }),
    money<VendorRow>('Paid', (r) => r.paid),
    money<VendorRow>('Still owed', (r) => r.open),
    {
      label: '% of total',
      align: 'right',
      value: (r) => (total ? Number(((r.total / total) * 100).toFixed(1)) : 0),
      format: (r) => `${total ? ((r.total / total) * 100).toFixed(1) : '0.0'}%`,
    },
  ];

  const detailCols: Col<LineRow>[] = [
    { label: 'Vendor', value: (r) => r.vendor },
    { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
    { label: 'Expense #', value: (r) => r.number },
    { label: 'Type', align: 'center', value: (r) => (r.type === 'bill' ? 'Bill' : 'Paid'), format: (r) => typeChip(r.type) },
    { label: 'Account', value: (r) => r.account },
    { label: 'Description', value: (r) => r.description },
    money<LineRow>('Amount', (r) => r.amount),
  ];

  return (
    <ReportFrame
      title="Expenses by Vendor"
      printTitle={`Expenses by Vendor ${view === 'summary' ? 'Summary' : 'Detail'}`}
      periodText={p.label}
      loading={loading}
      error={error}
      maxWidth="max-w-6xl"
      controls={
        <>
          {p.controls}
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { value: 'summary', label: 'Summary' },
              { value: 'detail', label: 'Detail' },
            ]}
          />
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
              <option value="all">All</option>
              <option value="paid_now">Paid now</option>
              <option value="bill">Bills</option>
            </select>
          </Field>
          <Field label="Vendor / expense #">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-40" />
          </Field>
        </>
      }
      getCsv={() =>
        view === 'summary'
          ? { filename: `expenses-by-vendor-${p.start}-to-${p.end}.csv`, rows: tableCsv(summaryCols, vendors) }
          : { filename: `expenses-by-vendor-detail-${p.start}-to-${p.end}.csv`, rows: tableCsv(detailCols, lines) }
      }
      notes={<p>Posted expenses and bills only — voided entries are excluded. “Still owed” is the unpaid balance on bills.</p>}
    >
      <StatRow
        items={[
          { label: 'Vendors', value: vendors.length },
          { label: 'Expenses', value: filtered.length },
          { label: 'Total', value: fmt(total) },
          { label: 'Still owed', value: fmt(open), tone: open > 0 ? 'red' : 'green' },
        ]}
      />
      {view === 'summary' ? (
        <DataTable cols={summaryCols} rows={vendors} rowKey={(r) => r.vendor} empty="No expenses in this period" />
      ) : (
        <DataTable cols={detailCols} rows={lines} rowKey={(r) => r.key} empty="No expenses in this period" />
      )}
    </ReportFrame>
  );
}
